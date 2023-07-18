<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar style="display: flex">
        <q-btn outline style="visibility: hidden">Logout</q-btn>
        <q-toolbar-title style="flex-grow: 1; text-align: center"
          >VUestionnaire</q-toolbar-title
        >
        <q-btn
          outline
          @click="back"
          style="margin-right: 10px"
          v-if="
            !(
              (router.currentRoute.value.path == '/session/') |
              (router.currentRoute.value.path == '/session')
            )
          "
          >back</q-btn
        >
        <q-btn outline @click="logout">Logout</q-btn>
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

export default defineComponent({
  name: "ClientLayout",
  components: {},
  setup() {
    const store = useAppStore();
    const router = useRouter();

    const logout = () => {
      store.logout();
      router.replace("/");
    };
    const back = () => {
      router.back("/client/project/list");
    };
    return { logout, router, back };
  },
});
</script>
