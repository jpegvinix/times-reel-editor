import { Composition } from 'remotion'
import { MatchReel } from './MatchReel'
import { getDurationInFrames } from './constants'
import type { RenderGroup } from '../types'

type MatchReelCompositionProps = {
  groups: RenderGroup[]
}

export const MatchReelComposition = () => {
  const defaultProps: MatchReelCompositionProps = {
    groups: [
      {
        id: 'group-1',
        data: '15/03',
        timeA: {
          nome: 'Santos',
          escudoUrl: '/escudos/santos.png',
          cidade: 'Santos - SP',
          estadio: 'Vila Belmiro',
        },
        timeB: {
          nome: 'Corinthians',
          escudoUrl: '/escudos/corinthians.png',
        },
      },
    ],
  }

  return (
    <Composition
      id="MatchReelVideo"
      component={MatchReel}
      durationInFrames={getDurationInFrames(defaultProps.groups.length, 30)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const typedProps = props as MatchReelCompositionProps

        return {
          durationInFrames: getDurationInFrames(typedProps.groups.length, 30),
        }
      }}
    />
  )
}
