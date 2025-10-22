import React, { useState } from 'react'
import { Sparkles, Wand2, Music, Loader2 } from 'lucide-react'

const MusicGenerationForm = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [duration, setDuration] = useState(30)

  const genres = [
    'electronic', 'ambient', 'classical', 'jazz', 'rock', 
    'pop', 'hip-hop', 'techno', 'house', 'experimental'
  ]

  const moods = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Mysterious', 'Romantic',
    'Dramatic', 'Uplifting', 'Melancholic', 'Peaceful', 'Intense', 'Dreamy'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    onGenerate({
      prompt: prompt.trim(),
      genre,
      mood,
      duration
    })
  }

  const generateRandomPrompt = () => {
    const randomGenre = genres[Math.floor(Math.random() * genres.length)]
    const randomMood = moods[Math.floor(Math.random() * moods.length)]
    const prompts = [
      `A ${randomMood.toLowerCase()} ${randomGenre.toLowerCase()} song with beautiful melodies`,
      `${randomMood} instrumental ${randomGenre.toLowerCase()} music for relaxation`,
      `Upbeat ${randomGenre.toLowerCase()} track with ${randomMood.toLowerCase()} vibes`,
      `${randomMood} ${randomGenre.toLowerCase()} composition with rich harmonies`,
      `Modern ${randomGenre.toLowerCase()} song with ${randomMood.toLowerCase()} atmosphere`
    ]
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(randomPrompt)
    setGenre(randomGenre)
    setMood(randomMood)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Music Description
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the music you want to create... (e.g., 'A peaceful piano melody with soft strings')"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            required
          />
          <button
            type="button"
            onClick={generateRandomPrompt}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Generate random prompt"
          >
            <Wand2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Genre and Mood Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre (Optional)
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select genre...</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mood (Optional)
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select mood...</option>
            {moods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration: {duration} seconds
        </label>
        <input
          type="range"
          min="15"
          max="120"
          step="15"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>15s</span>
          <span>30s</span>
          <span>60s</span>
          <span>120s</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating Music...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span>Generate Music</span>
          </>
        )}
      </button>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Music className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for better results:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Be specific about instruments (e.g., "piano and violin")</li>
              <li>Describe the tempo (e.g., "slow and peaceful" or "fast and energetic")</li>
              <li>Mention the style or era (e.g., "classical baroque" or "modern electronic")</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

export default MusicGenerationForm