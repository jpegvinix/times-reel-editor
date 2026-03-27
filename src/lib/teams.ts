import { seedTeams } from '../data/seedTeams'
import type { Team } from '../types'
import { hasSupabaseEnv, supabase } from './supabase'

type TeamRow = {
  id: string
  nome: string
  arquivo_escudo: string | null
  escudo_url: string | null
  cidade: string | null
  estadio: string | null
  serie: string | null
  source: 'seeded' | 'custom' | null
}

const mapRowToTeam = (row: TeamRow): Team => ({
  id: row.id,
  nome: row.nome,
  arquivoEscudo: row.arquivo_escudo ?? undefined,
  escudoUrl:
    row.escudo_url?.trim() ||
    (row.arquivo_escudo ? `/escudos/${row.arquivo_escudo}` : '/favicon.svg'),
  cidade: row.cidade ?? undefined,
  estadio: row.estadio ?? undefined,
  serie: row.serie ?? undefined,
  source: row.source ?? 'seeded',
})

export const loadTeams = async (): Promise<Team[]> => {
  if (!hasSupabaseEnv || !supabase) {
    return seedTeams
  }

  const { data, error } = await supabase
    .from('teams')
    .select('id, nome, arquivo_escudo, escudo_url, cidade, estadio, serie, source')
    .order('nome', { ascending: true })

  if (error || !data?.length) {
    return seedTeams
  }

  return data.map(mapRowToTeam)
}
