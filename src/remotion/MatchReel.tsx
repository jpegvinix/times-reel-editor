import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { RenderGroup } from '../types'
import { colorA, colorB } from './constants'
import img1Src from '../../IMG1.png'
import img2Src from '../../IMG2.png'
import img3Src from '../../IMG3.png'

type MatchReelProps = {
  groups: RenderGroup[]
}

const resolveShieldSrc = (src: string) => {
  if (!src) return src
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src
  }

  const normalized = src.startsWith('/') ? src : `/${src}`
  return staticFile(normalized)
}

const TeamPanel = ({
  team,
  color,
  align,
}: {
  team: RenderGroup['timeA']
  color: string
  align: 'left' | 'right'
}) => {
  const radius = align === 'left' ? '28px 0 0 28px' : '0 28px 28px 0'

  return (
    <div
      style={{
        width: 188,
        height: 172,
        background: color,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src={resolveShieldSrc(team.escudoUrl)}
          alt={team.nome}
          style={{
            maxWidth: 120,
            maxHeight: 120,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}

export const MatchReel = ({ groups }: MatchReelProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const topSafeZone = 180
  const groupHeight = 172
  const groupGap = 10
  const titleGap = 130
  const bannerGap = 92
  const titleHeight = 38
  const bannerHeight = 160
  const contentHeight =
    titleHeight +
    titleGap +
    groups.length * groupHeight +
    (groups.length - 1) * groupGap +
    bannerGap +
    bannerHeight
  const availableHeight = 1920 - topSafeZone
  const startOffset = topSafeZone + Math.max((availableHeight - contentHeight) / 2, 0)

  const bannerSpring = spring({
    fps,
    frame: frame - (15 + groups.length * 9 + 20),
    config: {
      damping: 18,
      stiffness: 120,
    },
  })

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingLeft: 76,
          paddingRight: 76,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: startOffset,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: 928,
          }}
        >
          <div
            style={{
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              height: titleHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1,
              textTransform: 'uppercase',
              color: '#3b5bdb',
              letterSpacing: '0.32em',
            }}
          >
            Vagas limitadas
          </div>

          <div
            style={{
              marginTop: titleGap,
              display: 'flex',
              flexDirection: 'column',
              gap: groupGap,
              width: 927,
            }}
          >
            {groups.map((group, index) => {
              const start = 15 + index * 9
              const progress = interpolate(frame, [start, start + 15], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })

              return (
                <div
                  key={group.id}
                  style={{
                    width: 927,
                    height: groupHeight,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: progress,
                    transform: `translateX(${interpolate(progress, [0, 1], [-60, 0])}px)`,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', width: 376, height: groupHeight }}>
                    <TeamPanel team={group.timeA} color={colorA} align="left" />
                    <TeamPanel team={group.timeB} color={colorB} align="right" />
                  </div>

                  <div
                    style={{
                      width: 551,
                      height: groupHeight,
                      background: '#ffffff',
                      padding: '18px 34px 18px 34px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 4,
                      borderRadius: '0 28px 28px 0',
                      boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 72,
                        fontWeight: 800,
                        lineHeight: 1,
                        color: '#3557e0',
                      }}
                    >
                      {group.data || '--/--'}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#3557e0',
                        lineHeight: 1.05,
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '0 0 auto',
                        }}
                      >
                        <img
                          src={img3Src}
                          alt=""
                          style={{
                            width: 26,
                            height: 26,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                      <span>{group.timeA.cidade || 'Cidade pendente'}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: '#3557e0',
                        lineHeight: 1.05,
                      }}
                    >
                      {group.timeA.estadio || 'Estadio pendente'}
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: 188,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={img2Src}
                      alt=""
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              marginTop: bannerGap,
              transform: `translateY(${interpolate(bannerSpring, [0, 1], [80, 0])}px)`,
              opacity: bannerSpring,
              width: 582,
              height: bannerHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={img1Src}
              alt=""
              style={{
                width: 582,
                height: 160,
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
