import ky from 'ky'
import { useUserStore } from '@/store/user'

export const api = ky.create({
  prefix: '/api',
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const user = useUserStore.getState().user
        if (user) request.headers.set('x-user-id', user.id)
      },
    ],
  },
})
