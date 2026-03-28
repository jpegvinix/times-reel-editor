export type Team = {
  id: string
  nome: string
  escudoUrl: string
  arquivoEscudo?: string
  cidade?: string
  estadio?: string
  serie?: string
  source: 'seeded' | 'custom'
}

export type Group = {
  id: string
  timeAId: string
  timeBId: string
  data: string
}

export type TeamRole = 'timeA' | 'timeB'

export type TeamForm = {
  nome: string
  escudoUrl: string
  cidade: string
  estadio: string
}

export type RenderTeam = {
  nome: string
  escudoUrl: string
  arquivoEscudo?: string
  cidade?: string
  estadio?: string
}

export type RenderGroup = {
  id: string
  data: string
  timeA: RenderTeam
  timeB: RenderTeam
}
