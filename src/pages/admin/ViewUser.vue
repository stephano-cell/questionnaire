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
      <template v-if="role === 'client'">
        <q-select
          filled
          v-model="project"
          label="Project"
          :options="sortedProjects"
          multiple
          emit-value
          map-options
          option-value="id"
          option-label="projectName"
          filter
          filter-placeholder="Search projects"
        />
      </template>
    </q-form>
  </q-page>
</template>
<script>
import { computed, ref } from "vue";
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

    const username = ref(null);
    const fullName = ref(null);
    const email = ref(null);
    const companyName = ref(null);
    const password = ref(null);
    const role = ref(null);
    const allowLogin = ref(false);
    const project = ref([]);

    const roles = [
      { label: "admin", value: "admin" },
      { label: "client", value: "client" },
    ];
    if (props.mode === "new") {
      store.installActions([
        {
          label: "Insert",
          callback: () => {
            const userId = v4();

            store.insertNewUser({
              id: userId,
              username: username.value,
              fullName: fullName.value,
              email: email.value,
              companyName: companyName.value,
              password: password.value,
              role: role.value,
              allowLogin: allowLogin.value,
            });

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
          callback: () => {
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
            store.updateUser(props.id, updatedUser);

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
    };
  },
};
</script>
