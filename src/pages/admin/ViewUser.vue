<template>
  <q-page class="q-pa-md">
    <q-toolbar>
      <q-toolbar-title>{{ mode }} {{ username }}</q-toolbar-title>
    </q-toolbar>
    <q-form class="q-gutter-md">
      <q-input
        filled
        v-model="username"
        label="username *"
        hint="username"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />

      <q-input
        filled
        v-model="fullName"
        label="Full Name *"
        hint="Name and surname"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        filled
        v-model="email"
        type="email"
        label="e-mail *"
        hint="type email"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        filled
        v-model="companyName"
        label="Company Name *"
        hint="copmany name"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />

      <q-input
        filled
        v-model="password"
        type="password"
        label="password *"
        hint="Type a secure password 8+ characters"
        lazy-rules
        :rules="[(val) => (val && val.length > 7) || 'Please type something']"
      />
      <q-select
        filled
        v-model="role"
        label="Role *"
        :options="roles"
        emit-value
        map-options
      />
      <q-checkbox
        v-if="role !== 'admin'"
        v-model="allowLogin"
        label="Allow login"
      />
      <template v-if="role === 'client' || role === 'reviewer'">
        <q-select
          filled
          v-model="project"
          label="Project"
          :options="projects"
          option-value="id"
          option-label="name"
          multiple
          filter
          filter-placeholder="Search projects"
        />
      </template>
    </q-form>
  </q-page>
</template>
<script>
import { computed, ref, onMounted, watch } from "vue";

import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";
import { v4 } from "uuid";

export default {
  props: {
    mode: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const store = useAppStore();

    const router = useRouter();
    let prevProjects = [];

    const username = ref(null);
    const fullName = ref(null);
    const email = ref(null);
    const companyName = ref(null);
    const password = ref(null);
    const role = ref(null);
    const allowLogin = ref(false);
    const project = ref([]);
    const projects = ref([]);
    const roles = [
      { label: "admin", value: "admin" },
      { label: "client", value: "client" },
      { label: "reviewer", value: "reviewer" },
    ];
    onMounted(async () => {
      // Fetch projects when the component is mounted
      await store.fetchProjects();
      projects.value = store.projects; // Assign the fetched projects to the projects ref

      if (props.mode === "edit" && props.id) {
        const assignedProjects = await store.getProjectsAssignedToUser(
          props.id
        );
        project.value = assignedProjects.map((p) => {
          // find the full project object from projects based on the ID
          return projects.value.find((proj) => proj.id === p.id);
        });
      }
    });

    watch(
      project,
      (newProjects) => {
        const removedProjectsIds = prevProjects
          .filter((p) => p && !newProjects.map((np) => np.id).includes(p.id))
          .map((rp) => rp.id);

        if (removedProjectsIds.length) {
          store.unassignProjectsFromUser(props.id, removedProjectsIds);
        }

        prevProjects = [...newProjects];
      },
      { immediate: true }
    );

    if (props.mode === "new") {
      store.installActions([
        {
          label: "Insert",
          callback: async () => {
            const userId = v4();

            await store.insertNewUser({
              id: userId,
              username: username.value,
              fullName: fullName.value,
              email: email.value,
              companyName: companyName.value,
              password: password.value,
              role: role.value,
              allowLogin: allowLogin.value,
            });

            await store.assignProjectsToUser(userId, project.value, true);

            router.back();
          },
        },
      ]);
    } else if (props.mode === "edit") {
      if (!props.id) return alert("No user ID provided");
      const user = store.getUserByID(props.id);

      if (!user) return alert("User ID not found");

      username.value = user.username;
      fullName.value = user.fullName;
      email.value = user.email;
      companyName.value = user.companyName;
      role.value = user.role;
      allowLogin.value = user.allowLogin;

      store.installActions([
        {
          label: "Save",
          callback: async () => {
            const updatedUser = {
              id: props.id,
              username: username.value,
              fullName: fullName.value,
              email: email.value,
              companyName: companyName.value,
              role: role.value,
              allowLogin: allowLogin.value,
            };

            // If the password field is not empty, update the password
            if (password.value) {
              updatedUser.password = password.value;
            }

            // Update the user
            await store.updateUser(props.id, updatedUser);

            // Assign the selected projects to the user, but only if the list is not empty
            if (project.value.length > 0) {
              await store.assignProjectsToUser(props.id, project.value, false);
            }

            router.back();
          },
        },
      ]);
    } else {
      return alert("Invalid mode");
    }

    return {
      username,
      fullName,
      email,
      companyName,
      password,
      role,
      roles,
      allowLogin,
      project,
      projects,
      prevProjects,
    };
  },
};
</script>
