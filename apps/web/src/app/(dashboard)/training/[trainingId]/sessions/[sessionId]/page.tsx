'use client';

import { use } from 'react';
import { useTrainingSession } from '@training/hooks/useTrainingSession';
import SessionHeader from '@training/components/rep/Session/SessionHeader';
import AIAvatarPanel from '@training/components/rep/Session/AIAvatarPanel';
import LiveTranscriptPanel from '@training/components/rep/Session/LiveTranscriptPanel';
import SessionInputBar from '@training/components/rep/Session/SessionInputBar';
import SessionSidebar from '@training/components/rep/Session/SessionSidebar';
import PauseModal from '@training/components/rep/Session/PauseModal';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TrainingSessionPageProps {
  params: Promise<{ trainingId: string; sessionId: string }>;
}

export default function TrainingSessionPage({ params }: TrainingSessionPageProps) {
  const { trainingId, sessionId } = use(params);
  const session = useTrainingSession(trainingId, sessionId);

  // Loading state
  if (session.isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="skeleton h-5 w-48" />
          <div className="flex gap-3">
            <div className="skeleton h-9 w-32 rounded-lg" />
            <div className="skeleton h-9 w-28 rounded-lg" />
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="w-[60%] p-6">
            <div className="skeleton h-64 w-full rounded-xl mb-4" />
            <div className="skeleton h-48 w-full rounded-xl" />
          </div>
          <div className="w-[40%] border-l border-gray-200 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-5">
                <div className="skeleton h-3 w-24 mb-2" />
                <div className="skeleton h-4 w-full mb-1" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (session.error || !session.context) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 px-4">
        <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Session could not be started</h2>
        <p className="text-gray-600 mb-6">{session.error || "Failed to load session context."}</p>
        <Link 
          href={`/training/${trainingId}`}
          className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Back to Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <SessionHeader
        trainingTitle={session.context.trainingTitle}
        elapsedSeconds={session.elapsedSeconds}
        isPaused={session.isPaused}
        onTogglePause={session.togglePause}
        onEndSession={session.handleEndSession}
        trainingId={trainingId}
        sessionId={sessionId}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Live Session */}
        <div className="flex flex-col w-[60%] border-r border-gray-200 bg-[#1a1a2e]">
          <AIAvatarPanel 
            personaName={session.context.persona.name}
            isMicActive={session.isMicActive}
            onToggleMic={session.toggleMic}
          />
          
          <LiveTranscriptPanel 
            transcript={session.transcript}
            isAISpeaking={session.isAISpeaking}
          />
          
          <SessionInputBar
            value={session.inputValue}
            onChange={session.setInputValue}
            onSend={session.sendMessage}
            isDisabled={session.isAISpeaking}
          />
        </div>

        {/* Right Column - Reference Sidebar */}
        <div className="w-[40%] bg-white flex flex-col overflow-hidden">
          <SessionSidebar
            activeTab={session.activeSidebarTab}
            onTabChange={session.setActiveSidebarTab}
            context={session.context}
            sectionStatuses={session.sectionStatuses}
          />
        </div>
      </div>
      
      {session.isPaused && (
        <PauseModal 
          elapsedSeconds={session.elapsedSeconds}
          messageCount={session.transcript.length}
          onResume={session.togglePause}
        />
      )}
    </div>
  );
}
