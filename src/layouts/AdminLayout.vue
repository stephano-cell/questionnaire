<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar style="display: flex">
        <q-btn
          class="q-mx-xs"
          v-for="item in actionsWithoutSubmenu"
          v-bind:key="item.id"
          outline
          :disable="item.disable"
          @click="item.callback"
          >{{ item.label }}</q-btn
        >

        <q-btn
          class="q-mx-xs"
          v-for="item in actionsWithSubmenu"
          v-bind:key="item.id"
          outline
          :disable="item.disable"
        >
          {{ item.label }}
          <q-menu>
            <q-item
              clickable
              v-for="subitem in item.submenu"
              :key="subitem.label"
              @click="subitem.callback"
            >
              <q-item-section>{{ subitem.label }}</q-item-section>
            </q-item>
          </q-menu>
        </q-btn>

        <q-toolbar-title style="flex-grow: 1; text-align: center"
          >VUestionnaire</q-toolbar-title
        >
        <q-btn
          outline
          @click="back"
          class="q-mx-xs"
          v-if="
            !(
              (router.currentRoute.value.path == '/admin/') |
              (router.currentRoute.value.path == '/admin')
            )
          "
          >back</q-btn
        >
        <q-btn class="q-mx-xs" outline @click="logout">Logout</q-btn>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";
import { computed } from "vue";

export default defineComponent({
  name: "MainLayout",
  components: {},
  setup() {
    const store = useAppStore();
    const router = useRouter();
    const logout = () => {
      store.logout();
      router.replace("/");
    };
    const back = () => {
      router.back("/");
    };
    const dynamicActions = computed(() => store.getActions);
    const actionsWithoutSubmenu = computed(() => {
      return dynamicActions.value.filter((action) => !action.submenu);
    });
    const actionsWithSubmenu = computed(() => {
      return dynamicActions.value.filter((action) => action.submenu);
    });
    return {
      logout,
      router,
      back,
      actionsWithoutSubmenu,
      actionsWithSubmenu,
    };
  },
});
</script>
