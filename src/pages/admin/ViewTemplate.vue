<template>
  <div>
    <q-splitter v-model="splitterModel" style="height: 600px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-btn
            label="Create Group"
            color="primary"
            @click="showCreateGroupDialog = true"
            class="q-ma-md q-mb-ml"
          />

          <q-btn
            label="Create Question"
            color="secondary"
            @click="showCreateQuestionDialog = true"
            class="q-ma-md q-mb-ml"
          />
          <q-tree
            :nodes="groups"
            node-key="id"
            selected-color="primary"
            v-model:selected="selected"
            default-expand-all
            @dblclick="editSelected"
          />
        </div>
      </template>

      <template v-slot:after>
        <q-tab-panels
          v-model="selectedNodeId"
          animated
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel
            v-for="node in flattenedNodes"
            :key="node.id"
            :name="node.id"
          >
            <div class="text-h4 q-mb-md">{{ node.label }}</div>
            <p v-html="node.description"></p>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
    <q-btn
      label="Delete Group"
      color="orange"
      @click="showDeleteGroupDialog = true"
      class="q-ma-md q-mb-ml"
    />
    <q-btn
      label="Delete Question"
      color="orange"
      @click="showDeleteQuestionDialog = true"
      class="q-ma-md q-mb-ml"
    />
    <br />

    <q-dialog v-model="showEditGroupDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Edit Group Name</div>
        </q-card-section>
        <q-card-section>
          <q-select
            filled
            v-model="selectedGroupToEdit"
            :options="groupOptions"
            label="Select a group"
          />
          <q-input filled v-model="newGroupName" label="New Group Name" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="editGroup" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showEditQuestionDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Edit Question</div>
        </q-card-section>
        <q-card-section>
          <q-select
            filled
            v-model="selectedQuestionToEdit"
            :options="questionOptions"
            label="Select a question"
          />
          <q-input
            filled
            v-model="newQuestionTitle"
            label="New Question Title"
          />
          <q-editor
            filled
            v-model="newQuestionDescription"
            label="New Question Description"
            :dense="$q.screen.lt.md"
            :toolbar="[
              ['bold', 'italic', 'strike', 'underline'],

              [
                {
                  label: $q.lang.editor.fontSize,
                  icon: $q.iconSet.editor.fontSize,
                  fixedLabel: true,
                  fixedIcon: true,
                  list: 'no-icons',
                  options: [
                    'size-1',
                    'size-2',
                    'size-3',
                    'size-4',
                    'size-5',
                    'size-6',
                    'size-7',
                  ],
                },
              ],
              [
                {
                  label: $q.lang.editor.align,
                  icon: $q.iconSet.editor.align,
                  fixedLabel: true,
                  list: 'only-icons',
                  options: ['left', 'center', 'right', 'justify'],
                },
                'unordered',
                'ordered',
              ],

              ['undo', 'redo'],
              ['fullscreen'],
            ]"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="editQuestion" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCreateGroupDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Create a new group</div>
        </q-card-section>
        <q-card-section>
          <q-input filled v-model="groupName" label="Group Name" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Create" color="primary" @click="addGroup" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCreateQuestionDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Create a new question</div>
        </q-card-section>
        <q-card-section>
          <q-input filled v-model="questionTitle" label="Question Title" />
          <q-select
            filled
            v-model="selectedGroup"
            :options="groupOptions"
            option-value="value"
            option-label="label"
            label="Select a group"
          />

          <q-editor
            filled
            v-model="questionDescription"
            label="Question Description"
            :dense="$q.screen.lt.md"
            :toolbar="[
              ['bold', 'italic', 'strike', 'underline'],

              [
                {
                  label: $q.lang.editor.fontSize,
                  icon: $q.iconSet.editor.fontSize,
                  fixedLabel: true,
                  fixedIcon: true,
                  list: 'no-icons',
                  options: [
                    'size-1',
                    'size-2',
                    'size-3',
                    'size-4',
                    'size-5',
                    'size-6',
                    'size-7',
                  ],
                },
              ],
              [
                {
                  label: $q.lang.editor.align,
                  icon: $q.iconSet.editor.align,
                  fixedLabel: true,
                  list: 'only-icons',
                  options: ['left', 'center', 'right', 'justify'],
                },
                'unordered',
                'ordered',
              ],

              ['undo', 'redo'],
              ['fullscreen'],
            ]"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Create" color="primary" @click="addQuestion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showDeleteGroupDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Delete Group</div>
        </q-card-section>
        <q-card-section>
          <q-select
            filled
            v-model="selectedGroupToDelete"
            :options="groupOptions"
            label="Select a group"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteGroup" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- ... -->
    <q-dialog v-model="showDeleteQuestionDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Delete Question</div>
        </q-card-section>
        <q-card-section>
          <q-select
            filled
            v-model="selectedQuestionToDelete"
            :options="questionOptions"
            label="Select a question"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteQuestion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";
import { v4 } from "uuid";

export default {
  setup() {
    const splitterModel = ref(20);
    const selected = ref("Food");
    const store = useAppStore();
    const router = useRouter();

    const selectedNodeId = computed(() => {
      const node = flattenedNodes.value.find(
        (node) => node.id === selected.value
      );
      return node ? node.id : null;
    });

    const groups = ref([]);
    const tempGroups = ref([]); // Temporary copy of groups

    // Load groups from the store when the component is mounted
    onMounted(async () => {
      await store.fetchGroups();
      const storedGroups = store.groupsData;
      if (storedGroups) {
        groups.value = storedGroups;
        tempGroups.value = JSON.parse(JSON.stringify(storedGroups)); // Make a deep copy of groups
      }
    });

    const editSelected = () => {
      const group = tempGroups.value.find((g) => g.id === selected.value);
      if (group) {
        // The selected node is a group
        selectedGroupToEdit.value = {
          label: group.label,
          value: group.id,
        };
        showEditGroupDialog.value = true;
      } else {
        // The selected node is a question
        let question = null;
        tempGroups.value.forEach((group) => {
          if (group.children) {
            const found = group.children.find((q) => q.id === selected.value);
            if (found) {
              question = found;
            }
          }
        });
        if (question) {
          selectedQuestionToEdit.value = {
            label: question.label,
            value: question.id,
          };
          showEditQuestionDialog.value = true;
        }
      }
    };

    const showCreateGroupDialog = ref(false);
    const showCreateQuestionDialog = ref(false);
    const groupName = ref("");
    const questionTitle = ref("");
    const questionDescription = ref("");
    const selectedGroup = ref("");

    watch(
      () => store.groupsData,
      (newGroupsData) => {
        groups.value = newGroupsData;
        tempGroups.value = JSON.parse(JSON.stringify(newGroupsData)); // Make a deep copy of groups
      },
      { immediate: true } // Run the watcher immediately when the component is created
    );

    const showEditGroupDialog = ref(false);
    const selectedGroupToEdit = ref("");
    const newGroupName = ref("");
    const showEditQuestionDialog = ref(false);
    const selectedQuestionToEdit = ref("");
    const newQuestionTitle = ref("");
    const newQuestionDescription = ref("");
    const showDeleteGroupDialog = ref(false);
    const selectedGroupToDelete = ref("");
    const showDeleteQuestionDialog = ref(false);
    const selectedQuestionToDelete = ref("");

    const flattenedNodes = computed(() => {
      // Flatten the tree nodes for the q-tab-panels
      let nodes = [];
      tempGroups.value.forEach((group) => {
        nodes.push(group);
        if (group.children) {
          nodes = nodes.concat(group.children);
        }
      });
      return nodes;
    });

    const groupOptions = computed(() => {
      // Map the groups to an array of options for the q-select
      return tempGroups.value.map((group) => ({
        label: group.label, // This will be displayed in the dropdown
        value: group.id, // Use the group's ID for comparison
      }));
    });

    const questionOptions = computed(() => {
      // Map the questions to an array of options for the q-select
      let options = [];
      tempGroups.value.forEach((group) => {
        if (group.children) {
          options = options.concat(
            group.children.map((child) => ({
              label: child.label,
              value: child.id, // Use the question's ID for comparison
            }))
          );
        }
      });
      return options;
    });
    const addGroup = () => {
      // Add a new group to the temporary data
      tempGroups.value.push({
        id: v4(), // Add a UUID to the group
        label: groupName.value,
        children: [],
      });
      tempGroups.value.sort((a, b) => a.label.localeCompare(b.label)); // Sort groups alphabetically
      groupName.value = "";
      showCreateGroupDialog.value = false;
    };
    const addQuestion = () => {
      // Add a new question to the selected group
      const group = tempGroups.value.find(
        (g) => g.id === selectedGroup.value.value
      );
      if (group) {
        group.children.push({
          id: v4(), // Add a UUID to the question
          label: questionTitle.value,
          description: questionDescription.value,
        });
        group.children.sort((a, b) => a.label.localeCompare(b.label)); // Sort questions alphabetically
        // Update the group label to include the new count

        questionTitle.value = "";
        questionDescription.value = "";
        selectedGroup.value = "";
        showCreateQuestionDialog.value = false;
      }
    };
    const editGroup = () => {
      // Edit the selected group
      const group = tempGroups.value.find(
        (g) => g.id === selectedGroupToEdit.value.value
      );

      if (group) {
        group.label = newGroupName.value;
        newGroupName.value = "";
        selectedGroupToEdit.value = "";
        showEditGroupDialog.value = false;
      }
    };

    const editQuestion = () => {
      // Edit the selected question
      let question = null;
      tempGroups.value.forEach((group) => {
        if (group.children) {
          const found = group.children.find(
            (q) => q.id === selectedQuestionToEdit.value.value
          );
          if (found) {
            question = found;
          }
        }
      });
      if (question) {
        question.label = newQuestionTitle.value;
        question.description = newQuestionDescription.value;
        newQuestionTitle.value = "";
        newQuestionDescription.value = "";
        selectedQuestionToEdit.value = "";
        showEditQuestionDialog.value = false;
      }
    };

    const deleteGroup = () => {
      // Delete the selected group
      const index = tempGroups.value.findIndex(
        (g) => g.id === selectedGroupToDelete.value.value
      );
      if (index !== -1) {
        tempGroups.value.splice(index, 1);
        selectedGroupToDelete.value = "";
        showDeleteGroupDialog.value = false;
      }
    };

    const deleteQuestion = () => {
      // Delete the selected question
      tempGroups.value.forEach((group) => {
        if (group.children) {
          const index = group.children.findIndex(
            (q) => q.id === selectedQuestionToDelete.value.value
          );
          if (index !== -1) {
            group.children.splice(index, 1);
            // Update the group label to include the new count
            selectedQuestionToDelete.value = "";
            showDeleteQuestionDialog.value = false;
          }
        }
      });
    };
    store.installActions([
      {
        label: "Save",
        callback: () => {
          // Copy the temporary data back to groups and save it to the store
          groups.value = JSON.parse(JSON.stringify(tempGroups.value));

          // Save all groups to the database
          groups.value.forEach((group) => {
            // If the group is new (i.e., it doesn't exist in the store), create it
            if (!store.groupsData.find((g) => g.id === group.id)) {
              store.createGroup(group);
            }
            // Otherwise, update it
            else {
              store.updateGroup(group.id, group);
            }
          });

          // Delete all groups in the store that don't exist in groups.value
          store.groupsData.forEach((group) => {
            if (!groups.value.find((g) => g.id === group.id)) {
              store.deleteGroup(group.id);
            }
          });

          router.back();
        },
      },
    ]);

    return {
      splitterModel,
      questionTitle,
      selectedGroup,
      selected,
      groups: tempGroups, // Use tempGroups in your template
      showCreateGroupDialog,
      showCreateQuestionDialog,
      groupName,
      addGroup,
      addQuestion,
      flattenedNodes,
      groupOptions,
      questionDescription,
      showEditGroupDialog,
      selectedGroupToEdit,
      newGroupName,
      editGroup,
      showEditQuestionDialog,
      selectedQuestionToEdit,
      newQuestionTitle,
      newQuestionDescription,
      editQuestion,
      questionOptions,
      showDeleteGroupDialog,
      selectedGroupToDelete,
      showDeleteQuestionDialog,
      selectedQuestionToDelete,
      deleteGroup,

      deleteQuestion,
      editSelected,
      selectedNodeId,
    };
  },
};
</script>
