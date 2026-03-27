import { useEffect, useId, useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import { AlertCircle, CheckCircle2, Download, Plus, Upload } from 'lucide-react'
import './App.css'
import { seedTeams } from './data/seedTeams'
import { MatchReel } from './remotion/MatchReel'
import { getDurationInFrames } from './remotion/constants'
import type { Group, RenderGroup, Team, TeamForm, TeamRole } from './types'

const defaultFixtures = [
  { timeAId: 'santos', timeBId: 'corinthians', data: '15/03' },
  { timeAId: 'flamengo', timeBId: 'vasco', data: '22/03' },
  { timeAId: 'palmeiras', timeBId: 'sao-paulo', data: '29/03' },
  { timeAId: 'gremio', timeBId: 'internacional', data: '05/04' },
  { timeAId: 'bahia', timeBId: 'fortaleza', data: '12/04' },
  { timeAId: 'cruzeiro', timeBId: 'atletico-mg', data: '19/04' },
]

const makeGroup = (index: number): Group => {
  const fixture = defaultFixtures[index]

  return {
    id: `group-${index + 1}`,
    timeAId: fixture?.timeAId ?? '',
    timeBId: fixture?.timeBId ?? '',
    data: fixture?.data ?? '',
  }
}

const makeInitialGroups = () => Array.from({ length: 3 }, (_, index) => makeGroup(index))

const emptyTeamForm: TeamForm = {
  nome: '',
  escudoUrl: '',
  cidade: '',
  estadio: '',
}

const getTeamError = (role: TeamRole, form: TeamForm) => {
  if (!form.nome.trim()) return 'Informe o nome do time.'
  if (!form.escudoUrl.trim()) return 'Informe a URL do escudo.'
  if (role === 'timeA' && !form.cidade.trim()) return 'Cidade e obrigatoria para o mandante.'
  if (role === 'timeA' && !form.estadio.trim()) return 'Estadio e obrigatorio para o mandante.'
  return null
}

function App() {
  const [teamCount, setTeamCount] = useState(3)
  const [teams, setTeams] = useState<Team[]>(seedTeams)
  const [groups, setGroups] = useState<Group[]>(makeInitialGroups)
  const [exportState, setExportState] = useState<'idle' | 'generating' | 'ready'>('idle')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [teamModal, setTeamModal] = useState<{
    groupId: string
    role: TeamRole
  } | null>(null)
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm)
  const uploadId = useId()

  useEffect(
    () => () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    },
    [downloadUrl],
  )

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.nome.localeCompare(b.nome)),
    [teams],
  )

  const groupsWithTeams = useMemo(() => {
    return groups.map((group) => ({
      ...group,
      timeA: teams.find((team) => team.id === group.timeAId),
      timeB: teams.find((team) => team.id === group.timeBId),
    }))
  }, [groups, teams])

  const errors = useMemo(() => {
    return groupsWithTeams.map((group, index) => {
      if (!group.timeA) return `Jogo ${index + 1}: selecione o time da casa.`
      if (!group.timeB) return `Jogo ${index + 1}: selecione o time visitante.`
      if (group.timeA.id === group.timeB.id) {
        return `Jogo ${index + 1}: o mandante e o visitante nao podem ser iguais.`
      }
      if (!group.data.trim()) return `Jogo ${index + 1}: informe a data.`
      if (!group.timeA.cidade || !group.timeA.estadio) {
        return `Jogo ${index + 1}: o time da casa precisa ter cidade e estadio cadastrados.`
      }
      return null
    })
  }, [groupsWithTeams])

  const renderGroups = useMemo<RenderGroup[]>(() => {
    return groupsWithTeams.map((group, index) => ({
      id: group.id,
      data: group.data || `${index + 1}`.padStart(2, '0') + '/04',
      timeA: {
        nome: group.timeA?.nome || 'Mandante',
        escudoUrl: group.timeA?.escudoUrl || '',
        cidade: group.timeA?.cidade,
        estadio: group.timeA?.estadio,
      },
      timeB: {
        nome: group.timeB?.nome || 'Visitante',
        escudoUrl: group.timeB?.escudoUrl || '',
        cidade: group.timeB?.cidade,
        estadio: group.timeB?.estadio,
      },
    }))
  }, [groupsWithTeams])

  const hasErrors = errors.some(Boolean)
  const durationInFrames = getDurationInFrames(teamCount, 30)

  const handleTeamCountChange = (nextCount: number) => {
    setTeamCount(nextCount)
    setExportState('idle')
    setGroups((current) => {
      if (current.length === nextCount) return current
      if (current.length > nextCount) return current.slice(0, nextCount)
      return [
        ...current,
        ...Array.from({ length: nextCount - current.length }, (_, index) =>
          makeGroup(current.length + index),
        ),
      ]
    })
  }

  const updateGroup = (groupId: string, patch: Partial<Group>) => {
    setExportState('idle')
    setGroups((current) =>
      current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    )
  }

  const openTeamModal = (groupId: string, role: TeamRole) => {
    setTeamModal({ groupId, role })
    setTeamForm(emptyTeamForm)
  }

  const closeTeamModal = () => {
    setTeamModal(null)
    setTeamForm(emptyTeamForm)
  }

  const saveCustomTeam = () => {
    if (!teamModal) return
    const validationError = getTeamError(teamModal.role, teamForm)
    if (validationError) return

    const newTeam: Team = {
      id: `${teamForm.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      nome: teamForm.nome.trim(),
      escudoUrl: teamForm.escudoUrl.trim(),
      cidade: teamForm.cidade.trim() || undefined,
      estadio: teamForm.estadio.trim() || undefined,
      source: 'custom',
    }

    setTeams((current) => [...current, newTeam])
    updateGroup(teamModal.groupId, {
      [teamModal.role === 'timeA' ? 'timeAId' : 'timeBId']: newTeam.id,
    })
    closeTeamModal()
  }

  const handleExport = () => {
    if (hasErrors) return

    setExportState('generating')
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }

    window.setTimeout(() => {
      const payload = {
        generatedAt: new Date().toISOString(),
        groups: renderGroups,
        note: 'MVP local: este arquivo representa o payload que sera enviado ao Cloud Run para gerar o MP4.',
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const nextUrl = URL.createObjectURL(blob)
      setDownloadUrl(nextUrl)
      setExportState('ready')
    }, 2200)
  }

  return (
    <main className="app-shell">
      <section className="editor-panel">
        <div className="eyebrow">Times Reel Studio</div>
        <h1>Monte o reel, valide na previa e dispare a exportacao.</h1>
        <p className="lead">
          Este MVP ja organiza os confrontos, permite cadastrar time novo e deixa o
          payload de render pronto para integrar com Supabase e Cloud Run.
        </p>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <h2>Configuracao do reel</h2>
              <p>Escolha quantos jogos entram no video e ajuste cada confronto.</p>
            </div>

            <label className="count-control">
              <span>Jogos</span>
              <select
                value={teamCount}
                onChange={(event) => handleTeamCountChange(Number(event.target.value))}
              >
                {[3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} jogos
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="groups-stack">
            {groupsWithTeams.map((group, index) => (
              <article className="match-card" key={group.id}>
                <div className="match-card__header">
                  <div>
                    <span className="match-card__label">Jogo {index + 1}</span>
                    <strong>
                      {group.timeA?.nome || 'Mandante'} x {group.timeB?.nome || 'Visitante'}
                    </strong>
                  </div>
                  {errors[index] ? (
                    <span className="status-chip status-chip--error">
                      <AlertCircle size={14} />
                      Incompleto
                    </span>
                  ) : (
                    <span className="status-chip status-chip--ok">
                      <CheckCircle2 size={14} />
                      Pronto
                    </span>
                  )}
                </div>

                <div className="form-grid">
                  <label>
                    <span>Time da casa</span>
                    <select
                      value={group.timeAId}
                      onChange={(event) =>
                        updateGroup(group.id, { timeAId: event.target.value })
                      }
                    >
                      <option value="">Selecione o mandante</option>
                      {sortedTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.nome} {team.source === 'custom' ? '• custom' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Time visitante</span>
                    <select
                      value={group.timeBId}
                      onChange={(event) =>
                        updateGroup(group.id, { timeBId: event.target.value })
                      }
                    >
                      <option value="">Selecione o visitante</option>
                      {sortedTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.nome} {team.source === 'custom' ? '• custom' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Data</span>
                    <input
                      value={group.data}
                      onChange={(event) => updateGroup(group.id, { data: event.target.value })}
                      placeholder="15/03"
                    />
                  </label>
                </div>

                {group.timeA ? (
                  <div className="resolved-meta">
                    <span>
                      Cidade resolvida: <strong>{group.timeA.cidade || 'Nao encontrada'}</strong>
                    </span>
                    <span>
                      Estadio resolvido: <strong>{group.timeA.estadio || 'Nao encontrado'}</strong>
                    </span>
                  </div>
                ) : null}

                <div className="match-card__actions">
                  <button type="button" className="ghost-button" onClick={() => openTeamModal(group.id, 'timeA')}>
                    <Plus size={16} />
                    Novo mandante
                  </button>
                  <button type="button" className="ghost-button" onClick={() => openTeamModal(group.id, 'timeB')}>
                    <Plus size={16} />
                    Novo visitante
                  </button>
                </div>

                {errors[index] ? <p className="error-copy">{errors[index]}</p> : null}
              </article>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <h2>Exportacao</h2>
              <p>O frontend valida os dados e prepara a chamada que ira para o Cloud Run.</p>
            </div>
          </div>

          <div className="export-box">
            <div>
              <strong>Status atual</strong>
              <p>
                {exportState === 'idle' && 'Pronto para gerar o video.'}
                {exportState === 'generating' && 'Gerando video...'}
                {exportState === 'ready' &&
                  'Payload pronto. O proximo passo e trocar esta simulacao pelo MP4 real.'}
              </p>
            </div>

            <div className="export-actions">
              <button type="button" className="primary-button" onClick={handleExport} disabled={hasErrors || exportState === 'generating'}>
                <Upload size={18} />
                {exportState === 'generating' ? 'Gerando...' : 'Exportar MP4'}
              </button>

              {downloadUrl ? (
                <a className="secondary-button" href={downloadUrl} download="render-payload.json">
                  <Download size={18} />
                  Baixar payload
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="preview-panel">
        <div className="preview-card">
          <div className="preview-card__top">
            <div>
              <span className="preview-kicker">Preview do reel</span>
              <h2>Formato 1080 x 1920</h2>
            </div>
            <dl className="preview-stats">
              <div>
                <dt>FPS</dt>
                <dd>30</dd>
              </div>
              <div>
                <dt>Duracao</dt>
                <dd>{Math.round(durationInFrames / 30)}s</dd>
              </div>
            </dl>
          </div>

          <div className="player-frame">
            <Player
              component={MatchReel}
              durationInFrames={durationInFrames}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={30}
              controls
              autoPlay
              loop
              style={{
                width: '100%',
                aspectRatio: '9 / 16',
                borderRadius: 28,
                overflow: 'hidden',
              }}
              inputProps={{
                groups: renderGroups,
              }}
            />
          </div>

          <div className="preview-notes">
            <div>
              <strong>Observacao</strong>
              <p>
                A exportacao final ainda esta simulada no frontend. O preview e o
                payload ja estao prontos para a proxima integracao do render real.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {teamModal ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="section-heading">
              <div>
                <h2>
                  {teamModal.role === 'timeA' ? 'Cadastrar novo mandante' : 'Cadastrar novo visitante'}
                </h2>
                <p>
                  {teamModal.role === 'timeA'
                    ? 'Mandante precisa ter cidade e estadio para o card.'
                    : 'Visitante precisa de nome e escudo. Cidade e estadio podem ser completados depois.'}
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                <span>Nome do time</span>
                <input
                  value={teamForm.nome}
                  onChange={(event) => setTeamForm((current) => ({ ...current, nome: event.target.value }))}
                  placeholder="Nome oficial"
                />
              </label>

              <label>
                <span>URL do escudo</span>
                <input
                  value={teamForm.escudoUrl}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, escudoUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="file-input">
                <span>Upload rapido local</span>
                <input
                  id={uploadId}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const fileUrl = URL.createObjectURL(file)
                    setTeamForm((current) => ({ ...current, escudoUrl: fileUrl }))
                  }}
                />
              </label>

              <label>
                <span>Cidade</span>
                <input
                  value={teamForm.cidade}
                  onChange={(event) => setTeamForm((current) => ({ ...current, cidade: event.target.value }))}
                  placeholder="Cidade - UF"
                />
              </label>

              <label>
                <span>Estadio</span>
                <input
                  value={teamForm.estadio}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, estadio: event.target.value }))
                  }
                  placeholder="Nome do estadio"
                />
              </label>
            </div>

            {getTeamError(teamModal.role, teamForm) ? (
              <p className="error-copy">{getTeamError(teamModal.role, teamForm)}</p>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={closeTeamModal}>
                Cancelar
              </button>
              <button type="button" className="primary-button" onClick={saveCustomTeam}>
                Salvar time
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
