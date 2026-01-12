<script setup>
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout()

const config = useRuntimeConfig()
const { clear } = useUserSession()

const userMenu = ref()

const toggleUserMenu = (event) => {
    userMenu.value.toggle(event)
}
function logout() {
    clear()
    nextTick(() => navigateTo('/login'))
}
const items = ref([
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => navigateTo('/user/profile')
    },
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => logout()
    }
])
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <span>{{config.public.appName}}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
            </div>

            <button type="button" class="layout-topbar-action" @click="toggleUserMenu" >
                <i class="pi pi-user"></i>
            </button>
            <Menu ref="userMenu" :model="items" :popup="true" />
        </div>
    </div>
</template>
