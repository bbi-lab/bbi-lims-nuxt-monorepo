import _ from 'lodash'

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (to.path.startsWith('/sge/')){
      return navigateTo(to.path.replace('/sge', ''))
    }
    return
  }
)
