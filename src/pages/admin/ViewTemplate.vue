<template>
  <div>
    <q-input
      filled
      v-model="templateName"
      label="Template Name"
      class="q-ma-md"
    />
    <q-input
      filled
      v-model="templateDescription"
      label="Template Description"
      class="q-ma-md"
    />
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
    const selected = ref("");
    const templateId = ref("");
    const store = useAppStore();
    const router = useRouter();
    const templateName = ref("");
    const deletedGroups = ref([]);
    const deletedQuestions = ref([]);
    const templateDescription = ref("");
    const selectedNodeId = computed(() => {
      const node = flattenedNodes.value.find(
        (node) => node.id === selected.value
      );
      return node ? node.id : null;
    });

    const tempGroups = ref([]); // Temporary copy of groups

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
        isNew: true, // Add this line
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
          isNew: true, // Add this line
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
        deletedGroups.value.push(selectedGroupToDelete.value.value);
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
            deletedQuestions.value.push(selectedQuestionToDelete.value.value);
            // Update the group label to include the new count
            selectedQuestionToDelete.value = "";
            showDeleteQuestionDialog.value = false;
          }
        }
      });
    };

    // In ViewTemplate.vue
    if (props.mode === "new") {
      store.installActions([
        {
          label: "Create",
          callback: async () => {
            // Create a new template
            const templateData = {
              name: templateName.value,
              description: templateDescription.value,
            };

            try {
              // Create a new template and get its ID
              const { id: templateId } = await store.postNewTemplate(
                templateData
              );

              // Create an array to store the promises for group and question creation
              const promises = [];

              // Create groups and questions
              tempGroups.value.forEach((group) => {
                const groupData = {
                  groupName: group.label,
                  templateId: templateId,
                };

                // Create a promise for group creation
                const createGroupPromise = store
                  .postNewTemplateGroup(groupData)
                  .then((groupResponse) => {
                    const groupId = groupResponse.data.id;

                    // Create questions for the group
                    group.children.forEach((question) => {
                      // Create a new question
                      const questionData = {
                        questionTitle: question.label,
                        questionDescription: question.description,
                        groupId: groupId,
                      };

                      // Create a promise for question creation
                      const createQuestionPromise =
                        store.postNewTemplateQuestion(questionData);
                      promises.push(createQuestionPromise);
                    });
                  });

                promises.push(createGroupPromise);
              });

              // Wait for all group and question creation promises to resolve
              await Promise.all(promises);

              // All groups and questions are created, navigate back
              router.back();
            } catch (error) {
              console.error(
                "Error creating template, groups, and questions:",
                error
              );
            }
          },
        },
      ]);
    } else if (props.mode === "edit") {
      onMounted(async () => {
        // Fetch template
        const template = await store.fetchTemplate(props.id);
        templateName.value = template.name;
        templateDescription.value = template.description;

        // Fetch template groups
        const groups = await store.fetchTemplateGroups(props.id);
        tempGroups.value = groups.map((group) => ({
          id: group.id,
          label: group.groupName,
          children: [],
        }));

        // Fetch template questions
        for (const group of tempGroups.value) {
          const questions = await store.fetchTemplateQuestions(group.id);
          group.children = questions.map((question) => ({
            id: question.id,
            label: question.questionTitle,
            description: question.questionDescription,
          }));
        }
      });
      store.installActions([
        {
          label: "Save",
          callback: async () => {
            // Update template
            const templateData = {
              name: templateName.value,
              description: templateDescription.value,
            };
            await store.updateTemplate(props.id, templateData);

            // Update and create groups and questions
            for (const group of tempGroups.value) {
              if (group.isNew) {
                // Create a new group
                const groupData = {
                  groupName: group.label,
                  templateId: props.id, // I'm assuming you want to link the new group to the current template
                };
                const response = await store.postNewTemplateGroup(groupData);
                group.id = response.data.id; // Update the group id with the id from the response
                delete group.isNew; // Remove the isNew attribute
              } else {
                // Update the existing group
                const groupData = {
                  groupName: group.label,
                };
                await store.updateTemplateGroup(group.id, groupData);
              }

              for (const question of group.children) {
                if (question.isNew) {
                  // Create a new question
                  const questionData = {
                    questionTitle: question.label,
                    questionDescription: question.description,
                    groupId: group.id, // I'm assuming you want to link the new question to the current group
                  };
                  const response = await store.postNewTemplateQuestion(
                    questionData
                  );
                  question.id = response.data.id; // Update the question id with the id from the response
                  delete question.isNew; // Remove the isNew attribute

                  // Fetch all projects that use the current template
                  const projects = await store.fetchProjectsByTemplateId(
                    props.id
                  );

                  // For each project, create a new entry in the projectsQuestions table
                  for (const project of projects) {
                    const projectQuestionData = {
                      isTicked: false,
                      isLocked: false,
                      isCompleted: false,
                      templateQuestionId: question.id,
                      projectId: project.id,
                    };
                    await store.createProjectQuestion(projectQuestionData);
                  }
                } else {
                  // Update the existing question
                  const questionData = {
                    questionTitle: question.label,
                    questionDescription: question.description,
                  };
                  await store.updateTemplateQuestion(question.id, questionData);
                }
              }
            }
            // Delete the groups and questions that have been marked for deletion
            for (const groupId of deletedGroups.value) {
              await store.deleteTemplateGroup(groupId);
            }
            for (const questionId of deletedQuestions.value) {
              await store.deleteTemplateQuestion(questionId);
            }
            // Clear the lists of deleted groups and questions only after they have been deleted from the database
            deletedGroups.value = [];
            deletedQuestions.value = [];

            // All groups and questions are updated, navigate back
            router.back();
          },
        },
      ]);
    } else {
      return alert("Invalid mode");
    }
    return {
      splitterModel,
      questionTitle,
      selectedGroup,
      selected,
      groups: tempGroups,
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
      templateName,
      templateDescription,
      deleteQuestion,
      editSelected,
      selectedNodeId,
      templateId,
      deletedGroups,
      deletedQuestions,
    };
  },
};
</script>
