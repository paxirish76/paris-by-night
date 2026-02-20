// src/lib/supabase.js
// Configuration de la connexion Supabase

import { createClient } from '@supabase/supabase-js'

// ⚠️ REMPLACEZ CES VALEURS PAR LES VÔTRES
// Vous les trouverez dans : Settings > API de votre projet Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-clé-anonyme'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper pour récupérer tous les personnages
export async function getPersonnages() {
  const { data, error } = await supabase
    .from('personnages')
    .select(`
      *,
      clan:clans(id, nom, couleur)
    `)
    .order('nom')

  if (error) {
    console.error('Erreur lors du chargement des personnages:', error)
    return []
  }

  return data
}

// Helper pour récupérer un personnage par ID
export async function getPersonnage(id) {
  const { data, error } = await supabase
    .from('personnages')
    .select(`
      *,
      clan:clans(id, nom, couleur)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors du chargement du personnage:', error)
    return null
  }

  return data
}

// Helper pour récupérer tous les clans
export async function getClans() {
  const { data, error } = await supabase
    .from('clans')
    .select('*')
    .order('nom')

  if (error) {
    console.error('Erreur lors du chargement des clans:', error)
    return []
  }

  return data
}

// Helper pour compter les personnages par clan
export async function getPersonnagesParClan() {
  const { data, error } = await supabase
    .from('personnages')
    .select('clan_id, clans(nom, couleur)')

  if (error) {
    console.error('Erreur:', error)
    return {}
  }

  // Grouper par clan
  return data.reduce((acc, p) => {
    const clanId = p.clan_id
    if (!acc[clanId]) {
      acc[clanId] = {
        nom: p.clans?.nom || clanId,
        couleur: p.clans?.couleur,
        membres: []
      }
    }
    acc[clanId].membres.push(p)
    return acc
  }, {})
}
