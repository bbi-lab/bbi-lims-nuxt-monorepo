import _ from 'lodash'

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { loggedIn, user, fetch } = useUserSession()

    await fetch()
    if (!_.get(user.value, 'isAdmin') && to.path.startsWith('/admin/')){
      return navigateTo('/')
    } else if (!loggedIn.value && !['/register', '/login', '/forgot-password'].includes(to.path)) {
      // if not logged in and not currently headed to login page, redirect there
      return navigateTo({path: '/login', query: {redirect: to.fullPath}})
    } else if (loggedIn.value && ['/register', '/login', '/forgot-password'].includes(to.path)) {
      // if already logged in and is headed to the login page, redirect to home
      // to prevent infinite redirect
      return navigateTo('/')
    }

    return
  }
)
