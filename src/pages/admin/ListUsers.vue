<template>
  <q-page class="q-pa-md">
    <div class="q-pa-md">
      <q-table
        flat
        bordered
        ref="tableRef"
        :class="tableClass"
        tabindex="0"
        title="Users"
        :rows="userRecords"
        :columns="columns"
        row-key="name"
        v-model:selected="selected"
        v-model:pagination="pagination"
        :filter="filter"
        @focusin="activateNavigation"
        @focusout="deactivateNavigation"
        @keydown="onKey"
      >
        <template v-slot:top-right>
          <q-input
            borderless
            dense
            debounce="300"
            v-model="filter"
            placeholder="Search"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
        <template v-slot:body-cell-assigned_projects="props">
          <q-td :props="props">
            <div v-if="props.row.role == 'client'">
              {{ props.row.projectNames.join(", ") }}
            </div>
            <span v-else>-</span>
          </q-td>
        </template>

        <template v-slot:body-cell-edit="props">
          <q-td :props="props">
            <q-btn flat icon="edit" @click="editUser(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, nextTick, toRaw, onMounted } from "vue";

import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";

const columns = [
  {
    name: "username",
    required: true,
    label: "Username",
    align: "left",
    field: "username",
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "fullName",
    align: "center",
    field: "fullName",
    label: "Full Name",
    sortable: true,
  },
  { name: "email", label: "email", field: "email" },
  { name: "company", label: "Company", field: "companyName", sortable: true },
  {
    name: "assigned_projects",
    label: "Assigned Projects",
    field: (row) => row.projectNames,
    sortable: true,
  },

  { name: "role", label: "role", field: "role", sortable: true },
  {
    name: "allowLogin",
    align: "center",
    label: "Allow Login",
    field: "allowLogin",
    format: (val, row) => {
      if (row.role === "admin") {
        return "";
      } else {
        return val ? "Yes" : "No";
      }
    },
    sortable: true,
  },
  {
    name: "edit",
    label: "",
    align: "center",
    field: () => "edit",
    sortable: false,
  },
];

export default {
  setup() {
    const tableRef = ref(null);
    const navigationActive = ref(false);
    const pagination = ref({});
    const userRecords = ref([]);

    const selected = ref([]);
    const store = useAppStore();

    const router = useRouter();
    onMounted(async () => {
      try {
        userRecords.value = await store.fetchAllUsersWithProjects();
        console.log("Users with projects", userRecords.value);
      } catch (error) {
        console.error("Error:", error);
      }
    });

    store.installActions([
      {
        label: "New User",
        callback: () => {
          router.push("/admin/user/new");
        },
      },
    ]);

    return {
      editUser(info) {
        store.editUser(router, info);
      },
      tableRef,
      navigationActive,
      filter: ref(""),
      selected,

      pagination,
      columns,
      userRecords,

      tableClass: computed(() =>
        navigationActive.value === true ? "shadow-8 no-outline" : null
      ),

      activateNavigation() {
        navigationActive.value = true;
      },

      deactivateNavigation() {
        navigationActive.value = false;
      },

      onKey(evt) {
        if (
          navigationActive.value !== true ||
          [33, 34, 35, 36, 38, 40].indexOf(evt.keyCode) === -1 ||
          tableRef.value === null
        ) {
          return;
        }

        evt.preventDefault();

        const { computedRowsNumber, computedRows } = tableRef.value;

        if (computedRows.length === 0) {
          return;
        }

        const currentIndex =
          selected.value.length > 0
            ? computedRows.indexOf(toRaw(selected.value[0]))
            : -1;
        const currentPage = pagination.value.page;
        const rowsPerPage =
          pagination.value.rowsPerPage === 0
            ? computedRowsNumber
            : pagination.value.rowsPerPage;
        const lastIndex = computedRows.length - 1;
        const lastPage = Math.ceil(computedRowsNumber / rowsPerPage);

        let index = currentIndex;
        let page = currentPage;

        switch (evt.keyCode) {
          case 36: // Home
            page = 1;
            index = 0;
            break;
          case 35: // End
            page = lastPage;
            index = rowsPerPage - 1;
            break;
          case 33: // PageUp
            page = currentPage <= 1 ? lastPage : currentPage - 1;
            if (index < 0) {
              index = 0;
            }
            break;
          case 34: // PageDown
            page = currentPage >= lastPage ? 1 : currentPage + 1;
            if (index < 0) {
              index = rowsPerPage - 1;
            }
            break;
          case 38: // ArrowUp
            if (currentIndex <= 0) {
              page = currentPage <= 1 ? lastPage : currentPage - 1;
              index = rowsPerPage - 1;
            } else {
              index = currentIndex - 1;
            }
            break;
          case 40: // ArrowDown
            if (currentIndex >= lastIndex) {
              page = currentPage >= lastPage ? 1 : currentPage + 1;
              index = 0;
            } else {
              index = currentIndex + 1;
            }
            break;
        }

        if (page !== pagination.value.page) {
          pagination.value.page = page;

          nextTick(() => {
            const { computedRows } = tableRef.value;
            selected.value = [
              computedRows[Math.min(index, computedRows.length - 1)],
            ];
            tableRef.value.$el.focus();
          });
        } else {
          selected.value = [computedRows[index]];
        }
      },
    };
  },
};
</script>
