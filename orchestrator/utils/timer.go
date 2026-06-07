package utils

import (
	"sync"
	"time"
)

type Timer_t struct {
	mu        sync.Mutex
	cmdCh     chan timerCommand
	isRunning bool
	isPaused  bool
}

type timerCommand int

const (
	timerCommandStop timerCommand = iota
	timerCommandPause
	timerCommandReset
)

func StartPeriodicTimer(localTimer *Timer_t, intervalMs int, onExpired func()) {
	startTimer(localTimer, intervalMs, true, onExpired)
}

func StartOneShotTimer(localTimer *Timer_t, delayMs int, onExpired func()) {
	startTimer(localTimer, delayMs, false, onExpired)
}

func StopTimer(localTimer *Timer_t) {
	if localTimer == nil {
		return
	}

	localTimer.mu.Lock()
	cmdCh := localTimer.cmdCh
	localTimer.cmdCh = nil
	localTimer.isRunning = false
	localTimer.isPaused = false
	localTimer.mu.Unlock()

	enqueueTimerCommand(cmdCh, timerCommandStop)
}

func PauseTimer(localTimer *Timer_t) {
	if localTimer == nil {
		return
	}

	localTimer.mu.Lock()
	if localTimer.cmdCh == nil || !localTimer.isRunning || localTimer.isPaused {
		localTimer.mu.Unlock()
		return
	}

	cmdCh := localTimer.cmdCh
	localTimer.isPaused = true
	localTimer.mu.Unlock()

	enqueueTimerCommand(cmdCh, timerCommandPause)
}

func ResetTimer(localTimer *Timer_t) {
	if localTimer == nil {
		return
	}

	localTimer.mu.Lock()
	if localTimer.cmdCh == nil || !localTimer.isRunning || localTimer.isPaused {
		localTimer.mu.Unlock()
		return
	}

	cmdCh := localTimer.cmdCh
	localTimer.mu.Unlock()

	enqueueTimerCommand(cmdCh, timerCommandReset)
}

func startTimer(localTimer *Timer_t, durationMs int, isPeriodic bool, onExpired func()) {
	if localTimer == nil || durationMs <= 0 || onExpired == nil {
		return
	}

	duration := time.Duration(durationMs) * time.Millisecond

	localTimer.mu.Lock()
	if localTimer.cmdCh != nil {
		localTimer.mu.Unlock()
		return
	}

	cmdCh := make(chan timerCommand, 4)
	localTimer.cmdCh = cmdCh
	localTimer.isRunning = true
	localTimer.isPaused = false
	localTimer.mu.Unlock()

	go runManagedTimer(localTimer, cmdCh, duration, isPeriodic, onExpired)
}

func runManagedTimer(localTimer *Timer_t, cmdCh chan timerCommand, duration time.Duration, isPeriodic bool, onExpired func()) {
	timer := time.NewTimer(duration)
	defer timer.Stop()

	for {
		select {
		case <-timer.C:
			onExpired()

			if !isPeriodic {
				localTimer.mu.Lock()
				if localTimer.cmdCh == cmdCh {
					localTimer.cmdCh = nil
					localTimer.isRunning = false
					localTimer.isPaused = false
				}
				localTimer.mu.Unlock()
				return
			}

			localTimer.mu.Lock()
			shouldContinue := localTimer.cmdCh == cmdCh && localTimer.isRunning && !localTimer.isPaused
			localTimer.mu.Unlock()
			if !shouldContinue {
				return
			}

			timer.Reset(duration)

		case command := <-cmdCh:
			switch command {
			case timerCommandStop:
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}
				return

			case timerCommandPause:
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}

			case timerCommandReset:
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}
				timer.Reset(duration)
			}
		}
	}
}

func enqueueTimerCommand(cmdCh chan timerCommand, command timerCommand) {
	if cmdCh == nil {
		return
	}

	select {
	case cmdCh <- command:
	default:
	}
}
