"use client";

import React from "react";

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string;
  lastResponse: string;
  confidence: number;
}

interface MedicationData {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  isTaken: boolean;
}

class VoiceInterfaceService {
  private onMedicationTaken?: (medicationId: string) => void;
  private recognition: any | null = null;
  private synthesis: any | null = null;
  private state: VoiceState = {
    isListening: false,
    isSupported: false,
    lastCommand: "",
    lastResponse: "",
    confidence: 0,
  };

  private medications: MedicationData[] = [];
  private onStateChange: ((state: VoiceState) => void) | null = null;
  private initialized: boolean = false;

  constructor() {}

  private initializeVoiceServices() {
    if (this.initialized || typeof window === "undefined") return;

    this.initialized = true;

    // Get speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.state.isListening = true;
        this.notifyStateChange();
      };

      this.recognition.onend = () => {
        this.state.isListening = false;
        this.notifyStateChange();
      };

      this.recognition.onresult = (event: any) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        console.log(`Heard: "${transcript}" (confidence: ${confidence})`);

        this.state.lastCommand = transcript;
        this.state.confidence = confidence;
        this.notifyStateChange();

        this.processCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        this.speak("Sorry, I didn't catch that. Please try again.");
      };
    }

    if ("speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
      this.state.isSupported = true;
    }

    console.log("🗣️ Voice interface initialized:", {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis,
      supported: this.state.isSupported,
    });
  }

  private async processCommand(transcript: string) {
    const command = transcript.toLowerCase().trim();

    if (
      command.includes("hey medicare") ||
      command.includes("hello") ||
      command.includes("hi medicare")
    ) {
      const responses = [
        "Hello! I'm your MediCare assistant. How can I help you today?",
        "Hi there! Ready to check on your medications?",
        "Good to hear from you! What would you like to know about your medicines?",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      this.speak(response);
    } else if (
      command.includes("what medications") ||
      command.includes("what pills") ||
      command.includes("what medicine")
    ) {
      this.handleListMedications();
    } else if (
      command.includes("did i take") ||
      command.includes("have i taken")
    ) {
      const medicationName = this.extractMedicationName(command);
      this.handleCheckTaken(medicationName);
    } else if (
      command.includes("i took") ||
      command.includes("just took") ||
      command.includes("i have taken")
    ) {
      const medicationName = this.extractMedicationName(command);
      this.handleMarkTaken(medicationName);
    } else if (
      command.includes("what time") ||
      command.includes("when should")
    ) {
      const medicationName = this.extractMedicationName(command);
      this.handleMedicationTime(medicationName);
    } else if (
      command.includes("help") ||
      command.includes("what can you do")
    ) {
      this.speak(
        'I can help you track medications, check if you\'ve taken them, and remind you about schedules. Try saying "What medications do I need today?" or "I took my heart medicine".'
      );
    } else {
      this.speak(
        'I didn\'t understand that. Try saying "help" to see what I can do, or say "Hey MediCare" to get started.'
      );
    }
  }

  private extractMedicationName(command: string): string {
    const words = command.split(" ");
    const medicationTerms = [
      "heart",
      "blood",
      "pressure",
      "vitamin",
      "multivitamin",
      "cough",
      "pain",
      "diabetes",
    ];

    for (const term of medicationTerms) {
      if (command.includes(term)) {
        return term;
      }
    }

    for (const med of this.medications) {
      if (command.includes(med.name.toLowerCase())) {
        return med.name;
      }
    }

    return "";
  }

  private findMedication(searchName: string): MedicationData | undefined {
    if (!searchName) return undefined;

    const search = searchName.toLowerCase();

    let found = this.medications.find(
      (med) =>
        med.name.toLowerCase().includes(search) ||
        search.includes(med.name.toLowerCase())
    );

    if (!found) {
      const commonTerms: { [key: string]: string[] } = {
        heart: ["heart", "cardiac", "blood pressure", "bp"],
        "blood pressure": ["bp", "blood pressure", "heart"],
        vitamin: ["vitamin", "multivitamin", "multi"],
        cough: ["cough", "cold"],
        pain: ["pain", "ibuprofen", "tylenol", "aspirin"],
      };

      for (const [key, terms] of Object.entries(commonTerms)) {
        if (terms.some((term) => search.includes(term))) {
          found = this.medications.find((med) =>
            terms.some((term) => med.name.toLowerCase().includes(term))
          );
          if (found) break;
        }
      }
    }

    return found;
  }

  private async handleListMedications() {
    if (this.medications.length === 0) {
      this.speak("You don't have any medications scheduled for today.");
      return;
    }

    const pendingMeds = this.medications.filter((med) => !med.isTaken);
    const takenMeds = this.medications.filter((med) => med.isTaken);

    let response = "";

    if (pendingMeds.length > 0) {
      const medList = pendingMeds.map((med) => med.name).join(", ");
      response += `You still need to take: ${medList}. `;
    }

    if (takenMeds.length > 0) {
      const takenList = takenMeds.map((med) => med.name).join(", ");
      response += `You've already taken: ${takenList}.`;
    }

    if (pendingMeds.length === 0 && takenMeds.length > 0) {
      response = "Great job! You've taken all your medications for today.";
    }

    this.speak(response);
  }

  private async handleCheckTaken(medicationName: string) {
    const medication = this.findMedication(medicationName);

    if (!medication) {
      if (medicationName) {
        this.speak(
          `I couldn't find a medication called ${medicationName}. Please check the name and try again.`
        );
      } else {
        this.speak("Which medication would you like me to check?");
      }
      return;
    }

    const status = medication.isTaken
      ? "Yes, you took"
      : "No, you haven't taken";
    this.speak(`${status} your ${medication.name} today.`);
  }

  private async handleMarkTaken(medicationName: string) {
    const medication = this.findMedication(medicationName);

    if (!medication) {
      if (medicationName) {
        this.speak(
          `I couldn't find a medication called ${medicationName}. Could you repeat the name clearly?`
        );
      } else {
        this.speak("Which medication did you take?");
      }
      return;
    }

    medication.isTaken = true;

    this.speak(
      `Excellent! I've marked your ${medication.name} as taken. Great job staying healthy!`
    );
    if (this.onMedicationTaken) {
      this.onMedicationTaken(medication.id);
    }
  }

  private async handleMedicationTime(medicationName: string) {
    const medication = this.findMedication(medicationName);

    if (!medication) {
      if (medicationName) {
        this.speak(`I couldn't find a medication called ${medicationName}.`);
      } else {
        this.speak("Which medication time would you like to know?");
      }
      return;
    }

    const times = medication.times.join(" and ");
    this.speak(`You should take your ${medication.name} at ${times}.`);
  }

  private speak(text: string) {
    if (typeof window === "undefined" || !this.synthesis) {
      return;
    }

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices = this.synthesis.getVoices();
    const preferredVoice =
      voices.find(
        (voice: any) =>
          voice.lang.startsWith("en") &&
          voice.name.toLowerCase().includes("female")
      ) || voices.find((voice: any) => voice.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {};

    utterance.onend = () => {};

    this.synthesis.speak(utterance);

    this.state.lastResponse = text;
    this.notifyStateChange();
  }

  // Public API methods
  public startListening() {
    this.initializeVoiceServices();

    if (!this.recognition) {
      this.speak("Voice recognition is not supported on this device.");
      return;
    }

    if (this.state.isListening) {
      console.log("Already listening...");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.speak(
        "Sorry, I couldn't start listening. Please check your microphone permissions."
      );
    }
  }

  public stopListening() {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
    }
  }

  public setMedicationTakenCallback(callback: (medicationId: string) => void) {
    this.onMedicationTaken = callback;
  }

  public updateMedications(medications: MedicationData[]) {
    this.medications = medications;
    console.log(`Updated medication list: ${medications.length} medications`);
  }

  public setStateChangeListener(callback: (state: VoiceState) => void) {
    this.onStateChange = callback;
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public getState(): VoiceState {
    return { ...this.state };
  }

  public isSupported(): boolean {
    this.initializeVoiceServices();
    return this.state.isSupported;
  }

  public testVoice() {
    this.initializeVoiceServices();
    this.speak(
      "Voice interface is working! You can now talk to me about your medications."
    );
  }
}

let serviceInstance: VoiceInterfaceService | null = null;

function getVoiceInterfaceService(): VoiceInterfaceService {
  if (!serviceInstance) {
    serviceInstance = new VoiceInterfaceService();
  }
  return serviceInstance;
}

export const voiceInterfaceService =
  typeof window !== "undefined" ? getVoiceInterfaceService() : null;

// React hook for components
export function useVoiceInterface() {
  const [state, setState] = React.useState<VoiceState>({
    isListening: false,
    isSupported: false,
    lastCommand: "",
    lastResponse: "",
    confidence: 0,
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const service = getVoiceInterfaceService();
    service.setStateChangeListener(setState);

    setState(service.getState());

    return () => {
      service.setStateChangeListener(() => {});
    };
  }, []);

  return {
    ...state,
    startListening: () => voiceInterfaceService?.startListening(),
    stopListening: () => voiceInterfaceService?.stopListening(),
    updateMedications: (meds: MedicationData[]) =>
      voiceInterfaceService?.updateMedications(meds),
    testVoice: () => voiceInterfaceService?.testVoice(),
    isSupported: voiceInterfaceService?.isSupported() || false,
  };
}

export function integrateVoiceWithMedications(
  medications: any[],
  takenMedications: Set<string>
) {
  if (typeof window === "undefined" || !voiceInterfaceService) return;

  const voiceMedications: MedicationData[] = medications.flatMap((med) => {
    // 🔧 FIX: Handle both string and array
    const timesArray = Array.isArray(med.times)
      ? med.times
      : typeof med.times === "string"
      ? med.times.split(",").map((t: string) => t.trim())
      : [];

    return timesArray.map((time: string) => ({
      id: `${med.id}-${time}`,
      name: med.name,
      dosage: med.dosage,
      times: [time],
      isTaken: takenMedications.has(`${med.id}-${time}`),
    }));
  });

  voiceInterfaceService.updateMedications(voiceMedications);
}
