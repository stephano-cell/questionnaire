<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar style="display: flex">
        <q-btn
          class="q-mx-xs"
          v-for="item in dynamicActions"
          v-bind:key="item.id"
          outline
          :disable="item.disable"
          @click="item.callback"
          >{{ item.label }}</q-btn
        >
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
    return {
      logout,
      router,
      back,
      dynamicActions: computed(() => store.getActions),
    };
  },
});
</script>
