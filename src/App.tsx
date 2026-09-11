import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, SendIcon, TrophyIcon } from 'lucide-react';
import { useEvent } from './contexts/EventContext';
import { AudienceHeader } from './components/audience/AudienceHeader';
import { TeamSelectCard } from './components/audience/TeamSelectCard';
import {
  AlreadyVoted,
  VoteSubmitted,
  VotingClosed,
  VotingNotOpen } from
'./components/audience/AudienceStates';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Field';
import { Countdown } from './components/ui/Countdown';
import { TechLabel, TechScreen } from './components/ui/TechScreen';
import { TeamMark } from './components/ui/TeamMark';
import { useToast } from './components/ui/Toast';

const RANK_WORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

export default function App() {
  const {
    teams,
    settings,
    state,
    timer,
    hasVoted,
    myBallot,
    castVote
  } = useEvent();
  const toast = useToast();
  const [voterName, setVoterName] = useState('');
  const [picks, setPicks] = useState<string[]>([]);
  const [step, setStep] = useState<'onboarding' | 'select' | 'review'>('onboarding');
  const [sending, setSending] = useState(false);
  const [reVote, setReVote] = useState(false);

  const live = state === 'voting_live' || state === 'ending_soon';
  const rankOf = (id: string) => {
    const i = picks.indexOf(id);
    return i === -1 ? null : i + 1;
  };

  const toggle = (id: string) => {
    setPicks((p) =>
    p.includes(id) ? p.filter((x) => x !== id) : p.length < teams.length ? [...p, id] : p
    );
  };

  const submit = () => {
    setSending(true);
    window.setTimeout(() => {
      castVote(picks, voterName);
      setSending(false);
      toast('Vote recorded — thank you!', 'ok');
    }, 700);
  };

  const nextLabel = useMemo(() => {
    if (picks.length === 0) return 'Tap your 1st place team';
    if (picks.length === 1) return 'Now pick your 2nd place team';
    if (picks.length < teams.length - 1) return `Pick your ${RANK_WORD[picks.length]} place`;
    if (picks.length === teams.length - 1) return 'One more — pick your last place';
    return `Review your top ${teams.length}`;
  }, [picks.length]);

  let body: React.ReactNode = null;

  if (hasVoted && myBallot) {
    body = reVote ?
    <AlreadyVoted /> :

    <>
        <VoteSubmitted ballot={myBallot} teams={teams} />
        <div className="mx-auto max-w-md px-5 pb-14">
          <Button
          variant="ghost"
          size="sm"
          block
          onClick={() => setReVote(true)}>
          
            Simulate a second vote attempt
          </Button>
        </div>
      </>;

  } else if (state === 'not_started' || state === 'starting_soon') {
    body = <VotingNotOpen starting={state === 'starting_soon'} />;
  } else if (!live) {
    body =
    <VotingClosed
      headline={settings.postVotingHeadline}
      body={settings.postVotingBody}
      venue={settings.venue}
      sponsors={settings.sponsors} />;


  } else if (step === 'onboarding') {
    body = (
      <div className="mx-auto max-w-md px-5 pb-40 pt-16">
        <div className="text-center">
          <TechLabel>Welcome to the event</TechLabel>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight">
            Who's voting?
          </h1>
          <p className="mt-2 text-sm font-medium text-fg-muted">
            Please enter your name to proceed to the ballot.
          </p>
        </div>
        
        <div className="mt-10 space-y-6 rounded-lg border border-line bg-ink-900 p-6 shadow-panel">
          <Input 
            label="Your Full Name" 
            placeholder="e.g. Ahmed Ali"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
          />
          <Button 
            size="xl" 
            block 
            disabled={voterName.trim().length < 2}
            onClick={() => setStep('select')}>
            Continue to vote
          </Button>
        </div>
      </div>
    );
  } else if (step === 'review') {
    body =
    <div className="mx-auto max-w-md px-5 pb-40 pt-7">
        <button
        onClick={() => setStep('select')}
        className="mb-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-tech text-fg-muted transition-colors duration-150 hover:text-brand">
        
          <ArrowLeftIcon className="h-4 w-4" strokeWidth={2.5} />
          Change selection
        </button>
        <TechLabel>Step 02 / 02</TechLabel>
        <h1 className="mt-1.5 text-4xl font-extrabold leading-tight">
          Your Selection
        </h1>
        <p className="mt-1.5 text-sm font-medium text-fg-muted">
          Confirm the order below. You can only vote once.
        </p>
        <ul className="mt-6 space-y-3">
          {picks.map((id, i) => {
          const team = teams.find((t) => t.id === id)!;
          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.05,
                duration: 0.25,
                ease: [0.23, 1, 0.32, 1]
              }}
              className={`flex items-center gap-4 rounded-lg border px-4 py-4 ${
              i === 0 ?
              'border-brand-shade bg-brand' :
              'border-line-strong bg-ink-900'}`
              }>
              
                <span
                className={`num grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                i === 0 ?
                'bg-ink-950 text-brand' :
                'bg-brand text-ink-950'}`
                }>
                
                  {RANK_WORD[i]}
                </span>
                <TeamMark team={team} size={44} tone={i === 0 ? 'light' : 'dark'} />
                <span
                className={`min-w-0 flex-1 truncate text-lg font-extrabold ${
                i === 0 ? 'text-ink-950' : 'text-fg'}`
                }>
                
                  {team.name}
                </span>
              </motion.li>);

        })}
        </ul>
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ink-950/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto max-w-md">
            <Button
            size="xl"
            block
            loading={sending}
            icon={<SendIcon className="h-5 w-5" strokeWidth={2.5} />}
            onClick={submit}>
            
              {sending ? 'Submitting…' : 'Confirm Vote'}
            </Button>
          </div>
        </div>
      </div>;

  } else {
    body =
    <div className="mx-auto max-w-3xl px-5 pb-44 pt-7">
        <div className="rounded-lg border border-line bg-ink-900 p-5 shadow-panel">
          <Countdown
          seconds={timer}
          total={settings.votingDuration}
          running={live}
          size="lg" />
        
        </div>

        <div className="mt-8">
          <TechLabel>Step 01 / 02 · Rank all teams</TechLabel>
          <h1 className="mt-1.5 text-[40px] font-extrabold leading-[1.05]">
            Rank the <span className="text-brand">Teams</span>
          </h1>
          <p className="mt-2 text-base font-medium text-fg-muted">
            Rank the teams that impressed you the most.
          </p>
        </div>

        <ul className="mt-6 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {teams.map((team) =>
        <li key={team.id}>
              <TeamSelectCard
            team={team}
            rank={rankOf(team.id)}
            disabled={picks.length >= teams.length}
            onToggle={() => toggle(team.id)} />
          
            </li>
        )}
        </ul>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-950/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              {Array.from({ length: teams.length }).map((_, i) => {
              const id = picks[i];
              const team = teams.find((t) => t.id === id);
              return (
                <div
                  key={i}
                  className={`flex h-11 flex-1 items-center gap-2 overflow-hidden rounded-sm border px-2.5 ${
                  team ?
                  'border-brand/60 bg-brand/10' :
                  'border-dashed border-line-strong bg-ink-900'}`
                  }>
                  
                    <span
                    className={`num text-[10px] font-extrabold tracking-tech ${
                    team ? 'text-brand' : 'text-fg-dim'}`
                    }>
                    
                      {RANK_WORD[i]}
                    </span>
                    <span className="truncate text-xs font-bold text-fg-soft">
                      {team ? team.name : '—'}
                    </span>
                  </div>);

            })}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
              key={nextLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2.5 text-center text-xs font-extrabold uppercase tracking-tech text-fg-muted">
              
                {nextLabel}
              </motion.p>
            </AnimatePresence>
            <Button
            size="xl"
            block
            disabled={picks.length !== teams.length}
            icon={<TrophyIcon className="h-5 w-5" strokeWidth={2.5} />}
            onClick={() => setStep('review')}>
            
              Submit Vote
            </Button>
          </div>
        </div>
      </div>;

  }

  return (
    <TechScreen>
      <AudienceHeader
        eventName={settings.eventName}
        round={settings.round}
        state={state} />
      
      {body}
    </TechScreen>);

}