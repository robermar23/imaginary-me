'use client'

/**
 * @fileoverview Survey Step 3: Visual aesthetic — mood and art style preferences.
 */

import { useSessionStore } from '@/store/session'
import { MultiSelect, type MultiSelectOption } from '@/components/survey/MultiSelect'
import { SingleSelect, type SelectOption } from '@/components/survey/SingleSelect'
import type { ArtStyle, Mood } from '@/types'

const MOOD_OPTIONS: readonly MultiSelectOption<Mood>[] = [
  {
    value: 'cinematic',
    label: 'Cinematic & Epic',
    gradient: 'from-slate-700 to-slate-900',
    description: 'Dramatic, widescreen',
  },
  {
    value: 'dreamy',
    label: 'Dreamy & Soft',
    gradient: 'from-pink-400 to-purple-400',
    description: 'Ethereal, pastel',
  },
  {
    value: 'dark',
    label: 'Dark & Mysterious',
    gradient: 'from-gray-900 to-black',
    description: 'Moody, noir',
  },
  {
    value: 'vibrant',
    label: 'Vibrant & Colorful',
    gradient: 'from-orange-400 via-pink-400 to-purple-400',
    description: 'Bold, energetic',
  },
  {
    value: 'gritty',
    label: 'Gritty & Realistic',
    gradient: 'from-stone-600 to-stone-800',
    description: 'Raw, documentary',
  },
  {
    value: 'surreal',
    label: 'Fantastical & Surreal',
    gradient: 'from-violet-500 to-cyan-400',
    description: 'Dreamlike, impossible',
  },
]

const ART_STYLE_OPTIONS: readonly SelectOption<ArtStyle>[] = [
  {
    value: 'photorealistic',
    label: 'Photorealistic',
    icon: '📷',
    description: 'Ultra-realistic, DSLR',
  },
  {
    value: 'painted',
    label: 'Painted',
    icon: '🖌️',
    description: 'Oil, Renaissance portrait',
  },
  {
    value: 'anime',
    label: 'Anime / Manga',
    icon: '⛩️',
    description: 'Studio Ghibli influence',
  },
  {
    value: 'concept_art',
    label: 'Concept Art',
    icon: '🎨',
    description: 'ArtStation, matte painting',
  },
  {
    value: 'surprise',
    label: 'Surprise Me',
    icon: '✨',
    description: 'Let the AI decide',
  },
]

/**
 * Step 3 of the survey: visual aesthetic choices.
 * @returns AestheticStep element.
 */
export function AestheticStep() {
  const moods = useSessionStore((s) => s.surveyData.moods)
  const artStyle = useSessionStore((s) => s.surveyData.artStyle)
  const setMoods = useSessionStore((s) => s.setMoods)
  const setArtStyle = useSessionStore((s) => s.setArtStyle)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">
          How does your imagination look?
        </h2>
        <p className="text-muted-foreground text-sm">
          These shape the visual style of your generated worlds.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <MultiSelect<Mood>
          label="Mood"
          hint="Pick 1 or 2 that resonate with you"
          options={MOOD_OPTIONS}
          value={moods as Mood[]}
          onChange={setMoods}
          max={2}
        />

        <div className="border-t border-border" />

        <SingleSelect<ArtStyle>
          label="Art style"
          options={ART_STYLE_OPTIONS}
          value={artStyle}
          onChange={setArtStyle}
        />
      </div>
    </div>
  )
}
