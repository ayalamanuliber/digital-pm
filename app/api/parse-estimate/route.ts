import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Determine mime type - support both images and PDFs
    let mimeType = file.type;
    if (!mimeType) {
      // Infer from filename
      if (file.name.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (file.name.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else {
        mimeType = 'image/jpeg'; // default
      }
    }

    // Call Gemini API
    const prompt = `You are a construction estimating expert. Parse this estimate and extract ALL information into the EXACT JSON structure below.

RETURN ONLY THIS JSON STRUCTURE (no markdown, no extra text, no code blocks):

{
  "projectNumber": "estimate number",
  "clientName": "client name",
  "clientAddress": "address",
  "estimateDate": "YYYY-MM-DD",
  "tasks": [
    {
      "description": "task description",
      "quantity": number,
      "price": number,
      "amount": number,
      "type": "hvac|carpentry|electrical|plumbing|roofing|painting|flooring|other",
      "estimatedHours": number,
      "materials": [
        {"name": "material name", "quantity": number, "unit": "ft|pcs|lbs|sqft|etc", "estimatedCost": number}
      ]
    }
  ],
  "materials": [],
  "subtotal": number,
  "tax": number,
  "total": number
}

MANDATORY REQUIREMENTS - ZERO TASKS CAN BE MISSING THESE:

1. TYPE FIELD (REQUIRED FOR EVERY TASK):
   - Analyze the task description and ALWAYS assign ONE of these types:
   - "hvac" for: AC, heating, ventilation, ductwork, radon fan, air handler, furnace, HVAC
   - "electrical" for: wiring, outlets, switches, panels, lighting, electrical work, circuits
   - "plumbing" for: pipes, water, drain, toilet, sink, faucet, plumbing, sewer
   - "carpentry" for: framing, trim, doors, cabinets, wood, deck, carpentry, drywall
   - "roofing" for: roof, shingles, gutters, flashing, roofing, soffit
   - "painting" for: paint, staining, coating, finishing, painting
   - "flooring" for: floor, tile, carpet, hardwood, laminate, flooring, vinyl
   - "other" ONLY if truly none of the above apply
   - If uncertain, choose the CLOSEST match, never leave blank

2. MATERIALS ARRAY (REQUIRED FOR EVERY TASK):
   - EVERY task must have at least 1-5 materials
   - Intelligently infer materials from the description even if not explicitly listed
   - Examples:
     * "Install Radon Fan" → Radon mitigation fan (1 pcs), PVC piping (20 ft), Mounting hardware (1 pcs), Electrical wire (50 ft), Sealant (2 tube)
     * "Replace Water Heater" → Water heater tank (1 pcs), Copper piping (10 ft), Shut-off valve (2 pcs), Gas line connector (1 pcs), Drain pan (1 pcs)
     * "Install Outlet" → Electrical outlet (1 pcs), Wire nuts (4 pcs), Romex wire (25 ft), Junction box (1 pcs)
     * "Drywall Repair" → Drywall sheets (3 pcs), Joint compound (1 gal), Drywall tape (1 roll), Sandpaper (1 box), Primer (1 gal)
   - Estimate realistic quantities and unit costs
   - Common units: pcs (pieces), ft (feet), sqft (square feet), lbs (pounds), gal (gallons), box, roll, bag, tube

3. ESTIMATED HOURS (REQUIRED):
   - Simple tasks (outlet, small repair): 1-2 hours
   - Medium tasks (water heater, radon fan): 2-6 hours
   - Complex tasks (HVAC system, full remodel): 6-16 hours
   - Use your expertise to estimate realistically

4. PROJECT-LEVEL MATERIALS:
   - Leave as empty array [] (materials go in task-level only)

5. JSON ONLY:
   - Return ONLY the JSON object
   - No markdown, no code blocks, no explanations
   - Must be valid parseable JSON

ANALYZE THE ESTIMATE IMAGE CAREFULLY AND EXTRACT ALL DATA.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return NextResponse.json({ error: 'Failed to parse estimate', details: error }, { status: 500 });
    }

    const data = await response.json();
    console.log('Full Gemini response:', JSON.stringify(data, null, 2));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;

    if (!text) {
      console.error('No text in response. Full data:', data);
      return NextResponse.json({ error: 'No response from AI', data }, { status: 500 });
    }

    // Check if response was truncated
    if (finishReason === 'MAX_TOKENS') {
      console.warn('Response truncated due to MAX_TOKENS. Attempting to parse partial response...');
    }

    console.log('Raw AI response:', text);

    // Extract JSON from response - handle markdown code blocks and extra text
    let jsonText = text;

    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No JSON found in response', rawResponse: text }, { status: 500 });
    }

    // Clean up the JSON string - fix common AI formatting issues
    let cleanJson = jsonMatch[0]
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/\n/g, ' ')             // Remove newlines
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .trim();

    // If truncated, try to fix incomplete JSON
    if (finishReason === 'MAX_TOKENS' && !cleanJson.endsWith('}')) {
      console.log('Attempting to fix incomplete JSON...');
      // Close any open arrays or objects
      const openBraces = (cleanJson.match(/\{/g) || []).length;
      const closeBraces = (cleanJson.match(/\}/g) || []).length;
      const openBrackets = (cleanJson.match(/\[/g) || []).length;
      const closeBrackets = (cleanJson.match(/\]/g) || []).length;

      // Remove incomplete trailing text
      cleanJson = cleanJson.replace(/,\s*"[^"]*$/, '');  // Remove incomplete property
      cleanJson = cleanJson.replace(/,\s*\{[^}]*$/, ''); // Remove incomplete object

      // Close arrays
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleanJson += ']';
      }
      // Close objects
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleanJson += '}';
      }
    }

    console.log('Cleaned JSON:', cleanJson);

    try {
      const parsedData = JSON.parse(cleanJson);

      // Validate and provide defaults for required fields
      const validatedData = {
        projectNumber: parsedData.projectNumber || 'Unknown',
        clientName: parsedData.clientName || 'Unknown Client',
        clientAddress: parsedData.clientAddress || '',
        estimateDate: parsedData.estimateDate || new Date().toISOString().split('T')[0],
        tasks: parsedData.tasks || [],
        materials: parsedData.materials || [],
        subtotal: parsedData.subtotal || 0,
        tax: parsedData.tax || 0,
        total: parsedData.total || 0
      };

      return NextResponse.json(validatedData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse cleaned JSON at position:', parseError instanceof Error ? parseError.message : '');
      return NextResponse.json({
        error: 'Failed to parse JSON - The estimate may be too complex or the image quality too low',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        suggestion: 'Try uploading a clearer image or a simpler estimate',
        cleanedJson: cleanJson.substring(0, 500) + '...'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse estimate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
