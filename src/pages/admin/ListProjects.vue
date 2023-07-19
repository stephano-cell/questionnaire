<template>
  <q-page class="q-pa-md">
    <div class="q-pa-md">
      <q-table
        flat
        bordered
        ref="tableRef"
        :class="tableClass"
        tabindex="0"
        title="Projects"
        :rows="rows"
        :columns="columns"
        row-key="name"
        v-model:pagination="pagination"
        :filter="filter"
        @focusin="activateNavigation"
        @focusout="deactivateNavigation"
        @keydown="onKey"
        wrap-cells
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

        <template v-slot:body-cell-comment="props">
          <q-td :props="props">
            <div v-html="props.row.comment"></div>
          </q-td>
        </template>

        <template v-slot:body-cell-review="props">
          <q-td :props="props">
            <q-btn flat icon="preview" @click="reviewProject(props.row)" />
          </q-td>
        </template>
        <template v-slot:body-cell-edit="props">
          <q-td :props="props">
            <q-btn flat icon="edit" @click="editProject(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>
<script>
import { ref, computed, nextTick, toRaw, onMounted, watch } from "vue";

import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";

const columns = [
  {
    name: "projectName",
    align: "center",
    label: "Project Name",
    field: "projectName",
    sortable: true,
  },

  { name: "company", label: "Company", field: "company", sortable: true },
  {
    name: "templateName",

    label: "template",
    field: "templateName",
    sortable: true,
  },
  {
    name: "comment",
    style: "min-width: 200px; width: 300px",
    align: "left",
    label: "Comment",
    field: "comment",
  },
  {
    name: "last_client_activity",
    align: "center",
    label: "last_client_activity",
    field: "last_client_activity",
    sortable: true,
  },
  {
    name: "client_remaining_questions",
    align: "center",
    label: "Client:Remaining Question",
    field: "client_remaining_questions",
    sortable: true,
  },
  {
    name: "last_admin_activity",
    align: "center",
    label: "last_admin_activity",
    field: "last_admin_activity",
    sortable: true,
  },
  {
    name: "admin_remaining_review",
    align: "center",
    label: "Admin:remaining to review",
    field: "admin_remaining_reviewed",
    sortable: true,
  },
  {
    name: "status",
    align: "center",
    label: "status",
    field: "status",
    sortable: true,
  },

  {
    name: "review",
    label: "",
    align: "center",
    field: () => "review",
    sortable: false,
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
    const store = useAppStore();

    const router = useRouter();
    const rows = ref([]);

    store.installActions([
      {
        label: "New Project",
        callback: () => {
          router.push("/admin/project/new");
        },
      },
    ]);

    return {
      tableRef,
      store,

      router,
      navigationActive,
      filter: ref(""),
      pagination,
      columns,
      rows,
      reviewProject(info) {
        store.reviewProject(router, info);
      },
      editProject(info) {
        store.editProject(router, info);
      },
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
        }
      },
    };
  },
};
</script>
