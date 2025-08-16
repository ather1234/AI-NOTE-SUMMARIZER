import React, { useState } from 'react';

// Main App component
const App = () => {
  // State for the meeting transcript and the user's prompt
  const [transcript, setTranscript] = useState('');
  const [prompt, setPrompt] = useState('Summarize the key points and action items.');
  
  // State for the generated summary and its editability
  const [summary, setSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // State for email sharing functionality
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  
  // State to handle UI feedback like loading and messages
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [shareStatus, setShareStatus] = useState('');

  // Function to call the Gemini API and generate a summary
  const handleGenerateSummary = async () => {
    // Basic validation
    if (!transcript.trim()) {
      setMessage('Please enter a meeting transcript.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    // Construct the new, professional prompt for the LLM
    const professionalPrompt = `Based on the following meeting transcript, create a professional summary for a CEO. The summary should be concise and use bullet points. The most important points should be highlighted in bold. Make sure to clearly separate key takeaways and actionable items. The tone should be formal and direct.
    \n\n---\n${transcript}\n---\n
    Your summary format should be:\n
    **Key Takeaways**\n
    * Bullet point 1\n
    * **Bolded important point**\n
    * Bullet point 2\n
    \n**Action Items**\n
    * Action item 1\n
    * **Bolded important action item**\n
    * Action item 2`;

    const chatHistory = [{ role: "user", parts: [{ text: professionalPrompt }] }];
    const payload = { contents: chatHistory };
    const apiKey = "AIzaSyD4Vbn0iX0XInGjjM5Jdoc1I0GV32BGp0w"; // API key is provided by the canvas environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Exponential backoff for API calls
    const maxRetries = 5;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Throw an error for non-2xx status codes to trigger the catch block
        if (!response.ok) {
          throw new Error(`API response error: ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
          const generatedText = result.candidates[0].content.parts[0].text;
          setSummary(generatedText);
          setIsEditing(true); // Allow editing after generation
          setMessage('Summary generated successfully!');
          break; // Exit the retry loop on success
        } else {
          throw new Error('Unexpected API response structure.');
        }

      } catch (error) {
        console.error("Error generating summary:", error);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential delay
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(res => setTimeout(res, delay));
        } else {
          setMessage('Failed to generate summary after multiple retries. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to "send" the email (simulated)
  const sendEmail = async (email, content) => {
    // Note: A real email send would require a backend server.
    // In a production app, you would make a fetch call here to a server endpoint.
    // Example: await fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ email, content }) });
    return new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim() || !recipientEmail.trim()) {
      setShareStatus('Please enter a summary and a recipient email.');
      return;
    }
    
    setShareStatus('Sending...');
    
    try {
      await sendEmail(recipientEmail, summary);
      setShareStatus('Email sent successfully!');
      setTimeout(() => {
        setShowShareModal(false);
        setShareStatus('');
        setRecipientEmail('');
      }, 2000); // Close modal and clear status after a brief delay
      
    } catch (error) {
      setShareStatus('Failed to send email. Please try again.');
      console.error('Email send error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl shadow-lg mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700">
            AI Meeting Notes ✍️
          </h1>
          <p className="mt-2 text-gray-500">
            Summarize and share your meeting transcripts with a custom prompt.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transcript and Prompt Input */}
          <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col space-y-4">
            <h2 className="text-2xl font-bold text-indigo-600">Meeting Transcript</h2>
            <textarea
              placeholder="Paste your meeting notes or call transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows="10"
              className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            
            <h2 className="text-2xl font-bold text-indigo-600 mt-4">AI Prompt</h2>
            <input
              type="text"
              placeholder="e.g., 'Extract action items' or 'Summarize in a brief paragraph'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Summary'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-sm text-center font-medium ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
          </div>

          {/* Summary Display and Actions */}
          <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">Generated Summary</h2>
            <textarea
              placeholder="Your summary will appear here..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              readOnly={!isEditing}
              rows="10"
              className={`w-full p-3 border rounded-xl resize-none flex-grow focus:outline-none ${
                isEditing ? 'focus:ring-2 focus:ring-indigo-500 bg-white' : 'bg-gray-50 cursor-not-allowed'
              }`}
            ></textarea>
            
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={!summary}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  !summary ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50'
                }`}
              >
                {isEditing ? 'Stop Editing' : 'Edit Summary'}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                disabled={!summary}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  !summary ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white shadow-md hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50'
                }`}
              >
                Share via Email
              </button>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Share Summary</h3>
              <form onSubmit={handleShareSubmit} className="flex flex-col space-y-4">
                <input
                  type="email"
                  placeholder="Recipient's Email Address"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {shareStatus && (
                  <div className={`p-3 rounded-lg text-sm text-center font-medium ${
                    shareStatus.includes('successfully') ? 'bg-green-100 text-green-700' : 
                    shareStatus.includes('Sending') ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {shareStatus}
                  </div>
                )}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    disabled={shareStatus === 'Sending...'}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gray-400 text-white hover:bg-gray-500 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={shareStatus === 'Sending...'}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      shareStatus === 'Sending...' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
