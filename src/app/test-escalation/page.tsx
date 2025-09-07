"use client";

import React, { useState, useRef } from 'react';
import { AlertTriangle, Play, Square } from 'lucide-react';

const FixedEscalationTest = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [familyNotified, setFamilyNotified] = useState([]);
  const runningRef = useRef(false); // Use ref to maintain state through async operations

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const showNotification = (title, body, level) => {
    addLog(`Attempting ${title}`, 'info');
    
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
          tag: `level-${level}`,
          requireInteraction: level >= 3
        });

        setTimeout(() => {
          notification.close();
        }, 4000);

        addLog(`✅ ${title} notification sent`, 'success');
        return true;
      } else {
        addLog(`❌ No notification permission, showing alert`, 'warning');
        alert(`${title}: ${body}`);
        return false;
      }
    } catch (error) {
      addLog(`❌ Notification failed: ${error.message}`, 'error');
      alert(`${title}: ${body}`);
      return false;
    }
  };

  const playAudio = (type = 'gentle') => {
    addLog(`Playing ${type} audio`, 'info');
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'gentle') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      } else {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      addLog(`✅ ${type} audio played`, 'success');
    } catch (error) {
      addLog(`❌ Audio failed: ${error.message}`, 'error');
    }
  };

  const flashScreen = () => {
    addLog("Flashing screen", 'warning');
    
    try {
      const flashDiv = document.createElement('div');
      flashDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 0, 0, 0.6);
        z-index: 9999;
        pointer-events: none;
      `;

      document.body.appendChild(flashDiv);
      addLog("✅ Screen flash started", 'success');

      setTimeout(() => {
        if (flashDiv.parentElement) {
          document.body.removeChild(flashDiv);
          addLog("✅ Screen flash completed", 'success');
        }
      }, 1000);

    } catch (error) {
      addLog(`❌ Screen flash failed: ${error.message}`, 'error');
    }
  };

  const notifyFamily = (level) => {
    if (level >= 3) {
      // Level 3: Primary caregiver
      setFamilyNotified(prev => [...prev, 'priya']);
      addLog("📧 Email sent to Priya (Primary Caregiver)", 'error');
      addLog("📱 SMS sent to Priya: +1234567890", 'error');
    }
    
    if (level >= 4) {
      // Level 4: All family members
      setFamilyNotified(prev => [...prev, 'raj']);
      addLog("📞 Emergency call initiated to all contacts", 'error');
      addLog("📧 Emergency emails sent to all family members", 'error');
      addLog("📱 Emergency SMS sent to Raj: +1234567891", 'error');
    }
  };

  const executeLevel = async (level) => {
    setCurrentStep(level);
    addLog(`🚨 EXECUTING LEVEL ${level}`, 'warning');

    switch (level) {
      case 1:
        addLog("📢 LEVEL 1: Gentle Reminder (after 15 minutes)", 'info');
        showNotification("💊 Gentle Reminder", "Time to take your Heart Medicine", 1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        playAudio('gentle');
        break;

      case 2:
        addLog("📢 LEVEL 2: Firm Reminder (after 30 minutes)", 'warning');
        showNotification("⚠️ MISSED MEDICATION", "You missed your Heart Medicine! Please take it now.", 2);
        await new Promise(resolve => setTimeout(resolve, 1000));
        flashScreen();
        await new Promise(resolve => setTimeout(resolve, 1000));
        playAudio('loud');
        break;

      case 3:
        addLog("📢 LEVEL 3: Family Alert (after 60 minutes)", 'error');
        showNotification("👨‍👩‍👧‍👦 FAMILY ALERT", "Papa missed heart medicine. Priya has been notified.", 3);
        await new Promise(resolve => setTimeout(resolve, 1000));
        notifyFamily(3);
        break;

      case 4:
        addLog("📢 LEVEL 4: Emergency Escalation (after 120 minutes)", 'error');
        showNotification("🚨 EMERGENCY", "Multiple medications missed! All family members alerted!", 4);
        await new Promise(resolve => setTimeout(resolve, 1000));
        notifyFamily(4);
        break;
    }
  };

  const runEscalationTest = async () => {
    setIsRunning(true);
    runningRef.current = true;
    setCurrentStep(0);
    setLogs([]);
    setFamilyNotified([]);

    addLog("🚨 ESCALATION TEST STARTED", 'error');
    addLog("Scenario: Papa missed Heart Medicine at 8:00 AM", 'info');

    try {
      // Level 1
      if (runningRef.current) {
        addLog("⏰ Waiting 2 seconds before Level 1...", 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (runningRef.current) {
          await executeLevel(1);
        }
      }

      // Level 2
      if (runningRef.current) {
        addLog("⏰ Waiting 3 seconds before Level 2...", 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (runningRef.current) {
          await executeLevel(2);
        }
      }

      // Level 3
      if (runningRef.current) {
        addLog("⏰ Waiting 3 seconds before Level 3...", 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (runningRef.current) {
          await executeLevel(3);
        }
      }

      // Level 4
      if (runningRef.current) {
        addLog("⏰ Waiting 3 seconds before Level 4...", 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (runningRef.current) {
          await executeLevel(4);
        }
      }

      if (runningRef.current) {
        addLog("🏁 ESCALATION TEST COMPLETED", 'success');
      }

    } catch (error) {
      addLog(`❌ Test error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
      runningRef.current = false;
    }
  };

  const stopTest = () => {
    runningRef.current = false;
    setIsRunning(false);
    addLog("⏹️ Test stopped - Medication taken!", 'success');
    addLog("✅ Sending 'all good' notifications to family", 'success');
    
    // Clear family notifications
    setFamilyNotified([]);
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep(0);
    setFamilyNotified([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-500" />
        Fixed Emergency Escalation Test
      </h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={runEscalationTest}
            disabled={isRunning}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Test Running...' : 'Start Escalation Test'}
          </button>
          
          <button
            onClick={stopTest}
            disabled={!isRunning}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Medication Taken
          </button>
          
          <button
            onClick={clearLogs}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Clear Logs
          </button>
        </div>

        <div className="text-sm">
          Current Level: {currentStep} {isRunning && '(Running...)'}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`p-3 rounded text-center text-sm font-medium transition-colors ${
              currentStep >= level 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Level {level}
            <div className="text-xs mt-1">
              {level === 1 && 'Gentle'}
              {level === 2 && 'Firm + Flash'}
              {level === 3 && 'Family Alert'}
              {level === 4 && 'Emergency'}
            </div>
          </div>
        ))}
      </div>

      {/* Family Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-3 rounded ${familyNotified.includes('priya') ? 'bg-red-100 border border-red-300' : 'bg-gray-100'}`}>
          <div className="font-semibold">Priya (Daughter)</div>
          <div className="text-sm">Primary Caregiver</div>
          {familyNotified.includes('priya') && <div className="text-red-600 text-sm font-medium">✅ NOTIFIED</div>}
        </div>
        <div className={`p-3 rounded ${familyNotified.includes('raj') ? 'bg-red-100 border border-red-300' : 'bg-gray-100'}`}>
          <div className="font-semibold">Raj (Son)</div>
          <div className="text-sm">Family Member</div>
          {familyNotified.includes('raj') && <div className="text-red-600 text-sm font-medium">✅ NOTIFIED</div>}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
        <h3 className="text-white mb-2">Detailed Test Log:</h3>
        <div className="h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Click "Start Escalation Test" to begin...</div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warning' ? 'text-yellow-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  'text-blue-400'
                }`}
              >
                <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedEscalationTest;