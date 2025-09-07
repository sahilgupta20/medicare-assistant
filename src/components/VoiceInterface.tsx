"use client";

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, HelpCircle } from 'lucide-react';

interface VoiceInterfaceProps {
  medications?: any[];
  takenMedications?: Set<string>;
  onMedicationTaken?: (medicationId: string) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  medications = [],
  takenMedications = new Set(),
  onMedicationTaken
}) => {
  // State for voice interface
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceService, setVoiceService] = useState<any>(null);

  // Check browser support and import voice service
  useEffect(() => {
    const checkSupport = () => {
      const supported = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && 'speechSynthesis' in window;
      setIsSupported(supported);
    };

    if (typeof window !== 'undefined') {
      checkSupport();
      
      // Import voice service
      import('../lib/voice-interface').then(({ voiceInterfaceService }) => {
        if (voiceInterfaceService) {
          setVoiceService(voiceInterfaceService);
          
          // Set up state listener
          voiceInterfaceService.setStateChangeListener((state) => {
            setIsListening(state.isListening);
            setLastCommand(state.lastCommand);
            setLastResponse(state.lastResponse);
            setConfidence(state.confidence);
          });

          // Set up medication taken callback
          if (onMedicationTaken) {
            voiceInterfaceService.setMedicationTakenCallback(onMedicationTaken);
          }
        }
      });
    }
  }, [onMedicationTaken]);

  // Update medications when they change
  useEffect(() => {
    if (medications.length > 0 && voiceService && typeof window !== 'undefined') {
      import('../lib/voice-interface').then(({ integrateVoiceWithMedications }) => {
        integrateVoiceWithMedications(medications, takenMedications);
      });
    }
  }, [medications, takenMedications, voiceService]);

  // Voice control functions
  const startListening = () => {
    if (voiceService) {
      voiceService.startListening();
    } else {
      setLastResponse('Voice service not ready. Please wait a moment and try again.');
    }
  };

  const stopListening = () => {
    if (voiceService) {
      voiceService.stopListening();
    }
  };

  const testVoice = () => {
    if (voiceService) {
      voiceService.testVoice();
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Voice interface is loading. Please wait a moment.');
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <VolumeX className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800">Voice features not supported on this browser</span>
        </div>
      </div>
    );
  }

  const sampleCommands = [
    "Hey MediCare, what medications do I need today?",
    "Did I take my heart medicine?",
    "I took my blood pressure pill",
    "What time should I take my vitamins?",
    "How are you doing?",
    "Thank you for helping me"
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isListening ? (
            <Mic className="h-8 w-8 text-white" />
          ) : (
            <MicOff className="h-8 w-8 text-white" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-400 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Volume2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Voice Assistant</h2>
            <p className="text-gray-600">Talk to me about your medications</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommands(!showCommands)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Show voice commands"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Voice Commands Help */}
      {showCommands && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Try saying:</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            {sampleCommands.map((command, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>"{command}"</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Voice Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="h-6 w-6" />
              Listening... (Tap to stop)
            </>
          ) : (
            <>
              <MicOff className="h-6 w-6" />
              Start Voice Assistant
            </>
          )}
        </button>

        <button
          onClick={testVoice}
          className="bg-gray-500 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          <Volume2 className="h-5 w-5" />
          Test Voice
        </button>
      </div>

      {/* Status Display */}
      {(lastCommand || lastResponse) && (
        <div className="space-y-3">
          {lastCommand && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Mic className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">You said:</span>
                {confidence > 0 && (
                  <span className="text-xs text-green-600">
                    ({Math.round(confidence * 100)}% confident)
                  </span>
                )}
              </div>
              <p className="text-green-700 italic">"{lastCommand}"</p>
            </div>
          )}

          {lastResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">MediCare responded:</span>
              </div>
              <p className="text-blue-700">"{lastResponse}"</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Start Instructions */}
      {!lastCommand && !lastResponse && (
        <div className="text-center py-6">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-3">
              Click "Start Voice Assistant" and say "Hey MediCare" to begin
            </p>
            <div className="text-sm text-gray-500">
              You can talk naturally - ask questions, have conversations, or give commands
            </div>
          </div>
        </div>
      )}

      {/* Browser Permissions Note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Voice features require microphone permission. 
        If prompted, please allow microphone access.
      </div>
    </div>
  );
};

export default VoiceInterface;