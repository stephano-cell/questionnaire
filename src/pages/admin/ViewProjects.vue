<template>
  <div>
    <q-input
      filled
      v-model="projectName"
      label="Project Name"
      hint="Name of Project"
      lazy-rules
      :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      class="q-ma-md q-mb-ml"
    />

    <q-input
      filled
      v-model="company"
      label="Company"
      hint="Name of company"
      lazy-rules
      :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      class="q-ma-md q-mb-ml"
    />

    <div class="q-pa-md">
      <q-btn
        label="Add Comment"
        color="primary"
        @click="showCommentDialog = true"
        class="q-ma-md"
      />
    </div>

    <q-dialog v-model="showCommentDialog" persistent>
      <q-card>
        <q-card-section>
          <q-editor
            filled
            v-model="comment"
            label="comment"
            :dense="$q.screen.lt.md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveComment" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-splitter v-model="splitterModel" style="height: 600px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-btn
            label="Create Group"
            color="primary"
            @click="showCreateGroupDialog = true"
            class="q-ma-md"
          />

          <q-btn
            label="Create Question"
            color="secondary"
            @click="showCreateQuestionDialog = true"
            class="q-ma-md"
          />
          <q-tree
            :nodes="groups"
            node-key="id"
            selected-color="primary"
            v-model:selected="selected"
            v-model:ticked="ticked"
            tick-strategy="leaf"
            ticked-color="primary"
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
            class="q-mb-md"
            :dense="$q.screen.lt.md"
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
            label="Select a group"
          />
          <q-editor
            filled
            v-model="questionDescription"
            label="Question Description"
            :dense="$q.screen.lt.md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Create" color="primary" @click="addQuestion" />
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
    const splitterModel = ref(20);
    const store = useAppStore();

    const router = useRouter();
    const projectName = ref("");
    const company = ref("");
    const selected = ref("");
    const ticked = ref("");
    const selectedNodeId = computed(() => {
      const node = flattenedNodes.value.find(
        (node) => node.id === selected.value
      );
      return node ? node.id : null;
    });

    const comment = ref("");
    const saveComment = () => {
      // Save your comment here
      console.log(comment.value);

      // Close the dialog
      showCommentDialog.value = false;
    };

    const editSelected = () => {
      const group = groups.value.find((g) => g.id === selected.value);
      if (group) {
        // The selected node is a group
        selectedGroupToEdit.value = {
          label: group.label,
          value: group.id,
        };
        showEditGroupDialog.value = true;
      } else {
        // The selected node is a question
        const question = flattenedNodes.value.find(
          (n) => n.id === selected.value
        );
        if (question) {
          selectedQuestionToEdit.value = {
            label: question.label,
            value: question.id,
          };
          showEditQuestionDialog.value = true;
        }
      }
    };

    const computedGroups = computed(() => {
      return groups.value.map((group) => ({
        ...group,
        label: `${group.label} (${group.children.length})`,
      }));
    });

    const groups = ref([]);
    watch(
      ticked,
      () => {
        const traverse = (node) => {
          if (node.children) {
            node.children.forEach((child) => {
              child.ticked = ticked.value.includes(child.id);
            });
          }
        };
        groups.value.forEach(traverse);
      },
      { deep: true }
    );

    const showCreateGroupDialog = ref(false);
    const showCreateQuestionDialog = ref(false);
    const showCommentDialog = ref(false);

    const groupName = ref("");

    const showEditGroupDialog = ref(false);
    const selectedGroupToEdit = ref("");
    const newGroupName = ref("");
    const showEditQuestionDialog = ref(false);
    const selectedQuestionToEdit = ref("");
    const newQuestionTitle = ref("");
    const newQuestionDescription = ref("");

    const editQuestion = () => {
      if (
        selectedQuestionToEdit.value.label.trim() === "" ||
        newQuestionTitle.value.trim() === "" ||
        newQuestionDescription.value.trim() === ""
      ) {
        return;
      }

      const group = groups.value.find((g) =>
        g.children.find((c) => c.label === selectedQuestionToEdit.value.label)
      );

      if (group) {
        const question = group.children.find(
          (c) => c.label === selectedQuestionToEdit.value.label
        );

        if (question) {
          question.label = newQuestionTitle.value;
          question.description = newQuestionDescription.value;

          // Sort the questions alphabetically within the group.
          group.children.sort((a, b) => a.label.localeCompare(b.label));

          newQuestionTitle.value = "";
          newQuestionDescription.value = "";
          selectedQuestionToEdit.value = "";
          showEditQuestionDialog.value = false;
        }
      }
    };

    const questionOptions = computed(() => {
      const options = [];
      groups.value.forEach((group) => {
        group.children.forEach((child) => {
          options.push(child.label);
        });
      });
      return options;
    });
    const editGroup = () => {
      if (
        selectedGroupToEdit.value.label.trim() === "" ||
        newGroupName.value.trim() === ""
      ) {
        return;
      }

      const group = groups.value.find(
        (g) => g.label === selectedGroupToEdit.value.label
      );

      if (group) {
        group.label = newGroupName.value;

        newGroupName.value = "";
        selectedGroupToEdit.value = "";
        showEditGroupDialog.value = false;

        // Sort the groups alphabetically.
        groups.value.sort((a, b) => a.label.localeCompare(b.label));
      }
    };

    const addGroup = () => {
      if (groupName.value.trim() === "") {
        return;
      }

      groups.value = [
        ...groups.value,
        {
          id: v4(), // Assign a UUID to the new group
          label: groupName.value,
          children: [],
        },
      ];

      // Sort the groups alphabetically.
      groups.value.sort((a, b) => a.label.localeCompare(b.label));

      selected.value = groupName.value;
      groupName.value = "";
      showCreateGroupDialog.value = false;
    };

    const questionTitle = ref("");
    const selectedGroup = ref("");
    const questionDescription = ref("");

    const addQuestion = () => {
      if (
        questionTitle.value.trim() === "" ||
        questionDescription.value.trim() === "" ||
        selectedGroup.value.trim() === ""
      ) {
        return;
      }

      const group = groups.value.find((g) => g.label === selectedGroup.value);

      if (group) {
        group.children = [
          ...group.children,
          {
            id: v4(), // Assign a UUID to the new question
            label: questionTitle.value,
            description: questionDescription.value,
            ticked: false,
          },
        ];

        // Sort the questions alphabetically within the group.
        group.children.sort((a, b) => a.label.localeCompare(b.label));

        questionTitle.value = "";
        questionDescription.value = "";
        selectedGroup.value = "";
        showCreateQuestionDialog.value = false;
      }
    };
    const flattenedNodes = computed(() => {
      const nodes = [];
      const traverse = (node) => {
        if (node.children) {
          node.children.forEach(traverse);
        }
        nodes.push(node);
      };
      groups.value.forEach(traverse);
      return nodes;
    });

    const groupOptions = computed(() => {
      return groups.value.map((group) => group.label);
    });
    onMounted(async () => {
      await store.fetchGroups();
      if (store.groupsData) {
        groups.value = JSON.parse(JSON.stringify(store.groupsData)).map(
          (group) => {
            group.children = group.children.map((question) => {
              return question;
            });
            return group;
          }
        );
      }

      if (props.mode === "edit" && props.id) {
        const project = store.projectData.find(
          (project) => project.id === props.id
        );
        if (project) {
          projectName.value = project.projectName;
          company.value = project.company;
          comment.value = project.comment;
          groups.value = project.groups;

          // Set the ticked value to the ticked questions of the project
          ticked.value = getTickedQuestions(project.groups);
        }
      }
    });

    // Helper function to get the ticked groups from a project
    // Helper function to get the ticked groups from a project
    function getTickedQuestions(groups) {
      const tickedQuestions = [];
      const traverse = (node) => {
        if (node.children) {
          node.children.forEach((child) => {
            if (child.ticked) {
              tickedQuestions.push(child.id);
            }
          });
        }
      };
      groups.forEach(traverse);
      return tickedQuestions;
    }

    if (props.mode === "new") {
      store.installActions([
        {
          label: "CREATE PROJECT",
          callback: () => {
            // Create a deep copy of the groups
            const copiedGroups = JSON.parse(JSON.stringify(groups.value));

            // Assign new UUIDs to the groups and questions in the copy
            copiedGroups.forEach((group) => {
              group.id = v4();
              group.children.forEach((question) => {
                question.id = v4();
              });
            });

            store.insertNewProject({
              id: v4(),
              projectName: projectName.value,
              company: company.value,
              comment: comment.value,
              groups: copiedGroups.map((group) => ({
                ...group,
                children: group.children.map((question) => ({
                  ...question,
                  ticked: question.ticked,
                })),
              })),
            });
            router.back();
          },
        },
      ]);
    } else if (props.mode === "edit") {
      store.installActions([
        {
          label: "Save",
          callback: () => {
            // Create a deep copy of the groups
            const copiedGroups = JSON.parse(JSON.stringify(groups.value));

            // Assign new UUIDs to the groups and questions in the copy
            copiedGroups.forEach((group) => {
              group.id = v4();
              group.children.forEach((question) => {
                question.id = v4();
              });
            });

            // Find the index of the project to update
            const projectIndex = store.projectData.findIndex(
              (project) => project.id === props.id
            );

            if (projectIndex !== -1) {
              // Update the project
              store.projectData[projectIndex] = {
                id: props.id,
                projectName: projectName.value,
                company: company.value,
                comment: comment.value,
                groups: copiedGroups,
              };

              // Call the updateProject action with the project ID and updated project
              store.updateProject(props.id, {
                projectName: projectName.value,
                company: company.value,
                comment: comment.value,
                groups: copiedGroups,
              });

              router.back();
            }
          },
        },
        {
          label: "CLONE",
          callback: () => {
            // Create a deep copy of the groups
            // Clone the project
            const copiedGroups = JSON.parse(JSON.stringify(groups.value));

            // Assign new UUIDs to the groups and questions in the copy
            copiedGroups.forEach((group) => {
              group.id = v4();

              group.children.forEach((question) => {
                question.id = v4();
              });
            });

            // Insert the cloned project
            store.insertNewProject({
              id: v4(),
              projectName: projectName.value,
              company: company.value,
              comment: comment.value,
              groups: copiedGroups.map((group) => ({
                ...group,
                children: group.children.map((question) => ({
                  ...question,
                  ticked: question.ticked,
                })),
              })),
            });

            router.back();
          },
        },
      ]);
    }
    return {
      splitterModel,
      selectedNodeId,
      questionTitle,
      selectedGroup,
      selected,
      groups: computedGroups,
      showCreateGroupDialog,
      showCreateQuestionDialog,
      showCommentDialog,
      saveComment,
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
      ticked,
      editQuestion,
      questionOptions,
      editSelected,
      projectName,
      company,
      comment,
    };
  },
};
</script>
