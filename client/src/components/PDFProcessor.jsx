import React, { useState } from 'react';

export default function PDFProcessor() {
    const [file, setFile] = useState(null);
    const [occupation, setOccupation] = useState('');
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [useAssistant, setUseAssistant] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('occupation', occupation);
        formData.append('age', age);
        formData.append('useAssistant', useAssistant);

        try {
            const uploadResponse = await fetch('/api/process-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to process PDF');
            }

            const data = await uploadResponse.json();
            setResponse(data.analysis);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const renderAnalysisResults = () => {
        if (!response) return null;

        const { extractedInfo, occupationInfo, ratingInfo, formattedRating, calculations, references } = response;

        return (
            <div className="space-y-8">
                {/* Patient Information */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Patient Information</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        <p><span className="font-medium">Name:</span> {extractedInfo.name}</p>
                        <p><span className="font-medium">DOB:</span> {extractedInfo.date_of_birth}</p>
                        <p><span className="font-medium">Occupation:</span> {extractedInfo.occupation}</p>
                        <p><span className="font-medium">Date of Injury:</span> {extractedInfo.date_of_injury}</p>
                        <p><span className="font-medium">Claim #:</span> {extractedInfo.claim_number}</p>
                    </div>
                </div>

                {/* Body Parts and WPI */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Body Parts and WPI</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        {extractedInfo.body_parts.map((part, index) => (
                            <div key={index} className="mb-2">
                                <p><span className="font-medium">{part.part}:</span></p>
                                <p className="ml-4">WPI: {part.wpi_percentage}%</p>
                                {part.apportionment && (
                                    <p className="ml-4">Apportionment: {part.apportionment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Occupation Analysis */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Occupation Analysis</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        <p><span className="font-medium">Group Number:</span> {occupationInfo.group_number}</p>
                        <div className="mt-2">
                            <p className="font-medium">Body Part Variants:</p>
                            {occupationInfo.body_parts.map((part, index) => (
                                <p key={index} className="ml-4">
                                    {part.part}: Variant {part.variant}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rating Calculations */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Rating Calculations</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        {ratingInfo.impairments.map((imp, index) => (
                            <div key={index} className="mb-4">
                                <p className="font-medium">{imp.description}</p>
                                <p className="ml-4">Code: {imp.code}</p>
                                <p className="ml-4">WPI: {imp.wpi}%</p>
                                <p className="ml-4">FEC Adjusted: {imp.fec_adjusted}%</p>
                                <p className="ml-4">Occupation Adjusted: {imp.occupation_adjusted}%</p>
                                <p className="ml-4">Age Adjusted: {imp.age_adjusted}%</p>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="font-medium">Combined Rating: {ratingInfo.combined_rating}%</p>
                            <div className="mt-2">
                                <p className="font-medium">Combination Steps:</p>
                                {ratingInfo.combination_steps.map((step, index) => (
                                    <p key={index} className="ml-4">{step}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Rating */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Final Rating</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="font-medium mb-2">
                            {formattedRating.name} #{formattedRating.claim_number}
                        </p>
                        {formattedRating.ratings.map((rating, index) => (
                            <div key={index} className="mb-2">
                                <p className="font-mono">
                                    {rating.code} - {rating.wpi} - {rating.fec} - {rating.group_variant} - {rating.adjusted} - {rating.final}%
                                </p>
                                <p className="ml-4">{rating.description}</p>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <p><span className="font-medium">Combined Rating:</span> {formattedRating.combined_rating}%</p>
                            <p><span className="font-medium">PD Weeks:</span> {formattedRating.pd_weeks}</p>
                            <p><span className="font-medium">Age at DOI:</span> {formattedRating.age_doi}</p>
                            <p><span className="font-medium">Weekly Earnings:</span> ${formattedRating.weekly_earnings}</p>
                            <p><span className="font-medium">PD Rate:</span> ${formattedRating.pd_rate}/week</p>
                            <p><span className="font-medium">Total PD:</span> ${formattedRating.pd_total}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="font-medium">Future Medical:</p>
                            {formattedRating.future_medical.map((fm, index) => (
                                <p key={index} className="ml-4">
                                    {fm.specialty}: ${fm.cost}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Code Interpreter Results */}
                {calculations?.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold mb-2">Calculations and Analysis</h4>
                        <div className="bg-gray-50 p-4 rounded space-y-4">
                            {calculations.map((calc, index) => (
                                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="bg-gray-800 text-white p-2">
                                        <h5 className="text-sm font-mono">Python Code</h5>
                                    </div>
                                    <div className="p-3 bg-gray-100">
                                        <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                                            {calc.code}
                                        </pre>
                                    </div>
                                    <div className="bg-gray-800 text-white p-2">
                                        <h5 className="text-sm font-mono">Output</h5>
                                    </div>
                                    <div className="p-3">
                                        <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                                            {calc.output}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* File Search Results */}
                {references?.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold mb-2">Reference Information</h4>
                        <div className="bg-gray-50 p-4 rounded space-y-4">
                            {references.map((ref, index) => (
                                <div key={index} className="bg-white rounded-lg shadow">
                                    <div className="bg-blue-600 text-white p-2">
                                        <h5 className="font-medium">Search Query: {ref.query}</h5>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {ref.results.map((result, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-sm whitespace-pre-wrap">{result}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Workers' Compensation Document Processor</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
                            Occupation
                        </label>
                        <input
                            type="text"
                            id="occupation"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter occupation"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="age">
                            Age
                        </label>
                        <input
                            type="text"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter age"
                        />
                    </div>
                </div>

                <div className="mb-4 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useAssistant}
                            onChange={(e) => setUseAssistant(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Use Assistant API</span>
                    </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-upload"
                    />
                    <label
                        htmlFor="pdf-upload"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-blue-600 hover:text-blue-800">
                            {file ? file.name : 'Upload Medical Report (PDF)'}
                        </span>
                        <span className="text-sm text-gray-500">
                            Click or drag and drop
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading || !file}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading || !file
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Processing Document...' : 'Process Document'}
                </button>
            </form>

            {loading && (
                <div className="mt-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Analyzing document...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p className="font-medium">Error:</p>
                    <p>{typeof error === 'object' ? error.message || JSON.stringify(error) : error}</p>
                </div>
            )}

            {response && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">PDR Analysis Results</h3>
                    {renderAnalysisResults()}
                </div>
            )}
        </div>
    );
}
