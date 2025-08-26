import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const nearbyContactsSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude deve estar entre -90 e 90'),
  lng: z.number().min(-180).max(180, 'Longitude deve estar entre -180 e 180'),
  radius: z.number().min(1).max(100000, 'Raio deve estar entre 1 e 100000 metros').optional().default(1000),
})

/**
 * @swagger
 * /contacts/nearby:
 *   get:
 *     summary: Buscar contatos próximos
 *     description: Encontra contatos próximos a uma localização específica
 *     tags: [Contatos]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude da localização de referência
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude da localização de referência
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 1000
 *           minimum: 1
 *           maximum: 100000
 *         description: Raio de busca em metros
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Número máximo de contatos a retornar
 *     responses:
 *       200:
 *         description: Contatos próximos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Contact'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: Distância em metros
 *                 center:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                 radius:
 *                   type: number
 *                   description: Raio de busca utilizado
 *                 total:
 *                   type: integer
 *                   description: Total de contatos encontrados
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radius = parseInt(searchParams.get('radius') || '1000')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Validar parâmetros
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Latitude e longitude são obrigatórias e devem ser números válidos' },
        { status: 400 }
      )
    }

    const validatedParams = nearbyContactsSchema.parse({ lat, lng, radius })

    // Calcular bounding box para otimizar a consulta
    // Aproximadamente 1 grau = 111 km
    const radiusInDegrees = validatedParams.radius / 111000
    
    const minLat = validatedParams.lat - radiusInDegrees
    const maxLat = validatedParams.lat + radiusInDegrees
    const minLng = validatedParams.lng - radiusInDegrees
    const maxLng = validatedParams.lng + radiusInDegrees

    // Buscar contatos dentro do bounding box que tenham coordenadas
    const contactsInBounds = await prisma.contact.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { latitude: { gte: minLat, lte: maxLat } },
          { longitude: { gte: minLng, lte: maxLng } }
        ]
      },
      take: limit * 2 // Buscar mais para filtrar depois
    })

    // Calcular distância real e filtrar por raio
    const contactsWithDistance = contactsInBounds
      .map(contact => {
        if (!contact.latitude || !contact.longitude) return null
        
        const distance = calculateDistance(
          validatedParams.lat,
          validatedParams.lng,
          contact.latitude,
          contact.longitude
        )
        
        return {
          ...contact,
          distance: Math.round(distance)
        }
      })
      .filter(contact => contact !== null && contact.distance <= validatedParams.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      contacts: contactsWithDistance,
      center: {
        lat: validatedParams.lat,
        lng: validatedParams.lng
      },
      radius: validatedParams.radius,
      total: contactsWithDistance.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar contatos próximos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para calcular distância entre duas coordenadas usando a fórmula de Haversine
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Raio da Terra em metros
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}