'use client';

import React, { useState } from 'react';
import {
  Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle,
  Loader2, Sparkles, Download, X, Eye, Zap, Users, Calendar,
  DollarSign, Wrench, AlertTriangle, ChevronRight, Play
} from 'lucide-react';

export default function UploadAssignView() {
  const [uploadStep, setUploadStep] = useState<'upload' | 'parsing' | 'review' | 'assign'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Mock parsed data (will be from AI later)
  const mockParsedData = {
    estimateNumber: '2011',
    client: 'Jack Shippee',
    address: '2690 Stuart St, Denver CO 80212',
    date: '4 Sep 2025',
    total: 3953.25,
    tasks: [
      {
        id: 't1',
        title: 'Downspout Install and maintenance',
        cost: 80,
        requiredSkills: ['General Labor', 'Roofing'],
        estimatedHours: 1,
        materials: ['Downspout', 'Brackets', 'Sealant']
      },
      {
        id: 't2',
        title: 'Full AC service',
        description: 'Repair Insulation lines, Fill Refrigerant, Level units',
        cost: 475,
        requiredSkills: ['HVAC'],
        estimatedHours: 3,
        materials: ['Refrigerant', 'Insulation tape', 'Level']
      },
      {
        id: 't3',
        title: 'Smoke detectors in every bedroom, and floor',
        cost: 240,
        requiredSkills: ['Electrical'],
        estimatedHours: 2,
        materials: ['Smoke detectors', 'Batteries', 'Mounting hardware']
      },
      {
        id: 't4',
        title: 'GFCI in kitchen',
        cost: 75,
        requiredSkills: ['Electrical'],
        estimatedHours: 1,
        materials: ['GFCI outlet', 'Wire connectors']
      },
      {
        id: 't5',
        title: 'Install bathroom fan',
        cost: 270,
        requiredSkills: ['HVAC', 'Electrical'],
        estimatedHours: 2,
        materials: ['Bathroom fan', 'Vent duct', 'Electrical wire']
      },
      {
        id: 't6',
        title: 'Full HVAC Service, Clean and Certification',
        cost: 650,
        requiredSkills: ['HVAC'],
        estimatedHours: 4,
        materials: ['Filters', 'Cleaning supplies', 'Certification docs']
      },
      {
        id: 't7',
        title: 'Repairs on meter and panel',
        description: 'secure and seal meter base, label panel, add a neutral bar',
        cost: 525,
        requiredSkills: ['Electrical'],
        estimatedHours: 3,
        materials: ['Neutral bar', 'Labels', 'Sealant']
      },
      {
        id: 't8',
        title: 'Repair stucco',
        cost: 380,
        requiredSkills: ['Masonry'],
        estimatedHours: 4,
        materials: ['Stucco mix', 'Mesh', 'Paint']
      }
    ]
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    // Auto-start parsing
    simulateParsing();
  };

  const simulateParsing = () => {
    setUploadStep('parsing');
    setTimeout(() => {
      setParsedData(mockParsedData);
      setUploadStep('review');
    }, 2000);
  };

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      'HVAC': 'bg-blue-100 text-blue-800 border-blue-200',
      'Electrical': 'bg-amber-100 text-amber-800 border-amber-200',
      'Plumbing': 'bg-green-100 text-green-800 border-green-200',
      'Masonry': 'bg-purple-100 text-purple-800 border-purple-200',
      'General Labor': 'bg-gray-100 text-gray-800 border-gray-200',
      'Roofing': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900">Upload & Assign Workflow</h2>
          <div className="flex items-center gap-2">
            {uploadStep === 'parsing' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            {uploadStep === 'review' && <Sparkles className="w-5 h-5 text-green-600" />}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            uploadStep === 'upload' ? 'bg-blue-50 border-2 border-blue-500' :
            ['parsing', 'review', 'assign'].includes(uploadStep) ? 'bg-green-50 border-2 border-green-500' :
            'bg-gray-50 border-2 border-gray-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              ['parsing', 'review', 'assign'].includes(uploadStep) ? 'bg-green-500' :
              uploadStep === 'upload' ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              {['parsing', 'review', 'assign'].includes(uploadStep) ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Upload className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500">STEP 1</div>
              <div className="font-black text-gray-900">Upload</div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            uploadStep === 'parsing' ? 'bg-blue-50 border-2 border-blue-500' :
            ['review', 'assign'].includes(uploadStep) ? 'bg-green-50 border-2 border-green-500' :
            'bg-gray-50 border-2 border-gray-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              ['review', 'assign'].includes(uploadStep) ? 'bg-green-500' :
              uploadStep === 'parsing' ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              {['review', 'assign'].includes(uploadStep) ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500">STEP 2</div>
              <div className="font-black text-gray-900">AI Parse</div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            uploadStep === 'review' ? 'bg-blue-50 border-2 border-blue-500' :
            uploadStep === 'assign' ? 'bg-green-50 border-2 border-green-500' :
            'bg-gray-50 border-2 border-gray-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              uploadStep === 'assign' ? 'bg-green-500' :
              uploadStep === 'review' ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              {uploadStep === 'assign' ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Eye className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500">STEP 3</div>
              <div className="font-black text-gray-900">Review</div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            uploadStep === 'assign' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-gray-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              uploadStep === 'assign' ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500">STEP 4</div>
              <div className="font-black text-gray-900">Assign</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Step */}
      {uploadStep === 'upload' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div
            className={`border-4 border-dashed rounded-2xl p-12 transition-all text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Upload Estimate</h3>
            <p className="text-gray-600 font-medium mb-6">
              Drag & drop your PDF or image estimate, or click to browse
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold cursor-pointer transition-all shadow-lg hover:shadow-xl"
            >
              <FileText size={20} />
              Choose File
            </label>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="font-medium">PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon size={16} />
                <span className="font-medium">JPG, PNG</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsing Step */}
      {uploadStep === 'parsing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">AI is Parsing Your Estimate</h3>
            <p className="text-gray-600 font-medium mb-8">
              {selectedFile?.name} • Extracting tasks, costs, and requirements...
            </p>
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-700">Analyzing document</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-700">Extracting line items</span>
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Matching skills</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Calculating estimates</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Step */}
      {uploadStep === 'review' && parsedData && (
        <div className="space-y-6">
          {/* Project Info Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg text-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-blue-200 mb-1">Estimate #{parsedData.estimateNumber}</div>
                <h3 className="text-2xl font-black mb-2">{parsedData.client}</h3>
                <p className="text-blue-100 font-medium">{parsedData.address}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-200 mb-1">Total Budget</div>
                <div className="text-3xl font-black">${parsedData.total.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-500/30">
              <div className="text-center">
                <div className="text-2xl font-black">{parsedData.tasks.length}</div>
                <div className="text-xs text-blue-200 font-bold">TASKS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">
                  {parsedData.tasks.reduce((sum: number, t: any) => sum + t.estimatedHours, 0)}h
                </div>
                <div className="text-xs text-blue-200 font-bold">EST. TIME</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{parsedData.date}</div>
                <div className="text-xs text-blue-200 font-bold">DATE</div>
              </div>
            </div>
          </div>

          {/* Extracted Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">Extracted Tasks</h3>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-green-600">AI Extracted</span>
              </div>
            </div>

            <div className="space-y-3">
              {parsedData.tasks.map((task: any, index: number) => (
                <div key={task.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-gray-400">TASK {index + 1}</span>
                        <span className="text-xs font-black text-gray-900">${task.cost}</span>
                        <span className="text-xs font-bold text-gray-600">{task.estimatedHours}h</span>
                      </div>
                      <h4 className="font-black text-gray-900 mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 font-medium mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.requiredSkills.map((skill: string) => (
                          <span
                            key={skill}
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${getSkillColor(skill)}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 mt-2" />
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Wrench size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-600">
                        {task.materials.length} materials needed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setUploadStep('upload')}
                className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Start Over
              </button>
              <button
                onClick={() => setUploadStep('assign')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <Play size={20} />
                Proceed to Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Step - Coming Soon */}
      {uploadStep === 'assign' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">Auto-Assignment Engine</h3>
          <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto">
            The AI-powered assignment system will match tasks to workers based on skills, availability, and proximity.
          </p>
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold text-sm">
            <Sparkles size={16} />
            Coming in Next Build
          </div>
        </div>
      )}
    </div>
  );
}
