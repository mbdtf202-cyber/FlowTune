/**
 * Local Forte Actions Service - Local Forte Actions service simulation
 * Replaces real Forte Actions API calls in demo mode
 */

class ForteActionsServiceLocal {
  constructor() {
    this.workflows = new Map()
    this.templates = [
      {
        id: 'ambient-chill',
        name: 'Ambient Music',
        description: 'Peaceful and soothing ambient music',
        prompt: 'Create a peaceful ambient track with soft synthesizers and gentle atmospheric sounds',
        metadata: {
          genre: 'Ambient',
          mood: 'Calm',
          duration: 180,
          bpm: 70
        }
      },
      {
        id: 'electronic-energy',
        name: 'Electronic Dance',
        description: 'Energetic electronic music',
        prompt: 'Generate an energetic electronic dance track with driving beats and synthesized melodies',
        metadata: {
          genre: 'Electronic',
          mood: 'Energetic',
          duration: 240,
          bpm: 128
        }
      },
      {
        id: 'jazz-fusion',
        name: 'Jazz Fusion',
        description: 'Modern jazz fusion style',
        prompt: 'Create a sophisticated jazz fusion piece with complex harmonies and improvisation',
        metadata: {
          genre: 'Jazz',
          mood: 'Sophisticated',
          duration: 300,
          bpm: 120
        }
      },
      {
        id: 'rock-anthem',
        name: 'Rock Anthem',
        description: 'Powerful rock music',
        prompt: 'Generate a powerful rock anthem with driving guitars and strong rhythm section',
        metadata: {
          genre: 'Rock',
          mood: 'Powerful',
          duration: 210,
          bpm: 140
        }
      },
      {
        id: 'lo-fi-hip-hop',
        name: 'Lo-Fi Hip-Hop',
        description: 'Relaxed Lo-Fi hip-hop beats',
        prompt: 'Create a relaxed lo-fi hip-hop beat with vinyl crackle and mellow instruments',
        metadata: {
          genre: 'Hip-Hop',
          mood: 'Relaxed',
          duration: 150,
          bpm: 85
        }
      }
    ]
  }

  /**
   * Get template list
   */
  async getTemplates() {
    console.log('🎵 Forte Actions Local: Getting templates')
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      data: {
        templates: this.templates
      }
    }
  }

  /**
   * Quick generate workflow
   */
  async quickGenerate(params) {
    console.log('🎵 Forte Actions Local: Starting quick generate workflow', params)
    
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    // Create workflow status
    const workflow = {
      id: workflowId,
      status: 'running',
      currentStep: 'generating',
      params: params,
      startTime: Date.now(),
      steps: [
        { id: 'generate', name: 'AI Music Generation', status: 'running', startTime: Date.now() },
        { id: 'upload', name: 'IPFS Upload', status: 'pending' },
        { id: 'mint', name: 'NFT Minting', status: 'pending' },
        { id: 'complete', name: 'Complete', status: 'pending' }
      ]
    }
    
    this.workflows.set(workflowId, workflow)
    
    // Execute workflow asynchronously
    this.executeWorkflow(workflowId)
    
    return {
      success: true,
      data: {
        workflowId: workflowId
      }
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId)
    
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found'
      }
    }
    
    return {
      success: true,
      data: {
        workflowId: workflowId,
        status: workflow.status,
        currentStep: workflow.currentStep,
        steps: workflow.steps,
        result: workflow.result,
        error: workflow.error,
        progress: workflow.progress || 0
      }
    }
  }

  /**
   * Execute workflow (asynchronous)
   */
  async executeWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return
    
    try {
      // Step 1: AI music generation
      await this.simulateStep(workflowId, 'generate', 3000)
      
      // Step 2: IPFS upload
      workflow.currentStep = 'uploading'
      await this.simulateStep(workflowId, 'upload', 2000)
      
      // Step 3: NFT minting
      workflow.currentStep = 'minting'
      await this.simulateStep(workflowId, 'mint', 4000)
      
      // Complete
      workflow.status = 'completed'
      workflow.currentStep = 'complete'
      workflow.steps[3].status = 'completed'
      workflow.steps[3].endTime = Date.now()
      
      // Generate result
      workflow.result = {
        tokenId: Math.floor(Math.random() * 10000) + 1,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        ipfsHash: `Qm${Math.random().toString(36).substring(2, 48)}`,
        audioUrl: this.generateMockAudioUrl(),
        metadata: {
          title: workflow.params.title,
          artist: workflow.params.artist,
          genre: workflow.params.genre || 'Electronic',
          description: workflow.params.customPrompt || 'AI generated music'
        }
      }
      
      console.log('✅ Forte Actions Local: Workflow completed', workflowId)
      
    } catch (error) {
      console.error('❌ Forte Actions Local: Workflow failed', error)
      workflow.status = 'failed'
      workflow.error = error.message
    }
  }

  /**
   * Simulate workflow step
   */
  async simulateStep(workflowId, stepId, duration) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return
    
    const stepIndex = workflow.steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) return
    
    // Start step
    workflow.steps[stepIndex].status = 'running'
    workflow.steps[stepIndex].startTime = Date.now()
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - workflow.steps[stepIndex].startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      workflow.progress = (stepIndex * 25) + (progress * 0.25)
    }, 200)
    
    // Wait for step completion
    await new Promise(resolve => setTimeout(resolve, duration))
    
    clearInterval(progressInterval)
    
    // Complete step
    workflow.steps[stepIndex].status = 'completed'
    workflow.steps[stepIndex].endTime = Date.now()
    workflow.progress = (stepIndex + 1) * 25
  }

  /**
   * Generate mock audio URL
   */
  generateMockAudioUrl() {
    // Create a simple audio data URL (silent)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const buffer = audioContext.createBuffer(2, 44100 * 30, 44100) // 30 seconds of silence
    
    // Generate simple sine wave
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.1
      }
    }
    
    // Return a mock URL
    return `data:audio/wav;base64,${btoa('mock-audio-data')}`
  }

  /**
   * Clean up workflow
   */
  cleanupWorkflow(workflowId) {
    this.workflows.delete(workflowId)
  }

  /**
   * Get all workflow statuses (for debugging)
   */
  getAllWorkflows() {
    return Array.from(this.workflows.entries()).map(([id, workflow]) => ({
      id,
      status: workflow.status,
      currentStep: workflow.currentStep
    }))
  }
}

// Create singleton instance
const forteActionsServiceLocal = new ForteActionsServiceLocal()

export default forteActionsServiceLocal