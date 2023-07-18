<template>
  <q-page class="flex flex-center">
    <q-tabs>
      <q-tab name="users"
        ><q-icon
          color="orange"
          name="face"
          size="20em"
          @click="adminUserList"
        />
        Clients
      </q-tab>
      <q-tab name="projects"
        ><q-icon
          color="green"
          name="edit_document"
          size="20em"
          @click="adminProjectsList"
        />
        Projects
      </q-tab>
      <q-tab name="questionsTemplate"
        ><q-icon
          color="blue"
          name="quiz"
          size="20em"
          @click="adminGroupsList"
        />
        Template
      </q-tab>
    </q-tabs>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "IndexPage",
  setup() {
    const router = useRouter();

    const adminUserList = () => {
      router.push("/admin/user/list");
    };

    const adminProjectsList = () => {
      router.push("/admin/project/list");
    };
    const adminGroupsList = () => {
      router.push("/admin/question/manage");
    };
    return {
      adminUserList,
      adminProjectsList,
      adminGroupsList,
    };
  },
});
</script>

<style>
.mainMenu {
  font-size: 32 pt !important;
}
</style>
