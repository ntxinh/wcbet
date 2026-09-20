const errorSchema = {
  type: 'object',
  properties: { error: { type: 'string' } },
  required: ['error'],
} as const

const scoreBody = {
  type: 'object',
  properties: {
    matchId: { type: 'string', format: 'uuid' },
    homeScore: { type: 'integer', minimum: 0, maximum: 20 },
    awayScore: { type: 'integer', minimum: 0, maximum: 20 },
  },
  required: ['matchId', 'homeScore', 'awayScore'],
} as const

const matchSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    homeTeam: { type: 'string' },
    awayTeam: { type: 'string' },
    kickoffTime: { type: 'string', format: 'date-time' },
    homeScore: { type: ['integer', 'null'] },
    awayScore: { type: ['integer', 'null'] },
    status: { type: 'string', enum: ['upcoming', 'in_progress', 'finished'] },
  },
  required: ['id', 'homeTeam', 'awayTeam', 'kickoffTime', 'homeScore', 'awayScore', 'status'],
} as const

const jsonContent = (schema: unknown) => ({ 'application/json': { schema } })

export const openApiSpec = {
  openapi: '3.1.0',
  info: { title: 'CupClash API', version: '0.1.0' },
  paths: {
    '/api/users': {
      post: {
        summary: 'Log in or create user',
        requestBody: {
          required: true,
          content: jsonContent({
            type: 'object',
            properties: { name: { type: 'string', minLength: 1, maxLength: 30 } },
            required: ['name'],
          }),
        },
        responses: {
          '200': {
            description: 'User (upserted by name)',
            content: jsonContent({
              type: 'object',
              properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } },
              required: ['id', 'name'],
            }),
          },
          '400': { description: 'Invalid name', content: jsonContent(errorSchema) },
        },
      },
    },
    '/api/matches': {
      get: {
        summary: 'List matches, optionally filtered by status',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['upcoming', 'in_progress', 'finished'] },
          },
          {
            name: 'x-user-id',
            in: 'header',
            required: false,
            description: 'Include the user’s prediction on each match',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Matches ordered by kickoff time',
            content: jsonContent({
              type: 'array',
              items: {
                ...matchSchema,
                properties: {
                  ...matchSchema.properties,
                  prediction: {
                    type: ['object', 'null'],
                    properties: {
                      predictedHomeScore: { type: 'integer' },
                      predictedAwayScore: { type: 'integer' },
                      pointsEarned: { type: ['integer', 'null'] },
                    },
                    required: ['predictedHomeScore', 'predictedAwayScore', 'pointsEarned'],
                  },
                },
              },
            }),
          },
          '400': { description: 'Invalid status', content: jsonContent(errorSchema) },
        },
      },
    },
    '/api/predictions': {
      post: {
        summary: 'Create or update a prediction',
        parameters: [
          {
            name: 'x-user-id',
            in: 'header',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: { required: true, content: jsonContent(scoreBody) },
        responses: {
          '200': {
            description: 'Saved prediction',
            content: jsonContent({
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                matchId: { type: 'string', format: 'uuid' },
                predictedHomeScore: { type: 'integer' },
                predictedAwayScore: { type: 'integer' },
                pointsEarned: { type: ['integer', 'null'] },
              },
              required: [
                'id',
                'userId',
                'matchId',
                'predictedHomeScore',
                'predictedAwayScore',
                'pointsEarned',
              ],
            }),
          },
          '400': { description: 'Invalid prediction', content: jsonContent(errorSchema) },
          '401': { description: 'Not authenticated', content: jsonContent(errorSchema) },
          '404': { description: 'Match not found', content: jsonContent(errorSchema) },
          '409': { description: 'Match is locked', content: jsonContent(errorSchema) },
        },
      },
    },
    '/api/leaderboard': {
      get: {
        summary: 'Leaderboard sorted by total points descending',
        responses: {
          '200': {
            description: 'Users sorted by totalPoints desc, name asc',
            content: jsonContent({
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  image: { type: ['string', 'null'] },
                  totalPoints: { type: 'integer' },
                },
                required: ['id', 'name', 'image', 'totalPoints'],
              },
            }),
          },
        },
      },
    },
    '/api/admin/resolve-match': {
      post: {
        summary: 'Resolve a match and score its predictions',
        requestBody: { required: true, content: jsonContent(scoreBody) },
        responses: {
          '200': { description: 'Resolved match', content: jsonContent(matchSchema) },
          '400': { description: 'Invalid body', content: jsonContent(errorSchema) },
          '404': { description: 'Match not found', content: jsonContent(errorSchema) },
        },
      },
    },
    '/api/openapi.json': {
      get: {
        summary: 'This OpenAPI specification',
        responses: { '200': { description: 'OpenAPI 3.1 spec JSON' } },
      },
    },
  },
} as const
