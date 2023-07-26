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
    <template v-if="props.mode === 'new'">
      <q-select
        filled
        v-model="selectedTemplate"
        :options="templates"
        label="Select a template"
        @input="fetchTemplateDetails"
        option-label="name"
        option-value="id"
      />
    </template>

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
            label="Comment"
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
          <q-tree
            :nodes="groups"
            node-key="id"
            selected-color="primary"
            v-model:selected="selected"
            v-model:ticked="ticked"
            tick-strategy="leaf"
            ticked-color="primary"
          />
        </div>
      </template>
      <template v-slot:after>
        <q-tab-panels v-model="selectedNodeId" animated>
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
  </div>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";

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
    const comment = ref("");
    const showCommentDialog = ref(false);
    const selected = ref("");
    const ticked = ref([]);
    const saveComment = () => {
      // Save your comment here
      console.log(comment.value);

      // Close the dialog
      showCommentDialog.value = false;
    };

    const selectedNodeId = computed(() => {
      const node = flattenedNodes.value.find(
        (node) => node.id === selected.value
      );
      return node ? node.id : null;
    });

    const templates = ref([]);
    const selectedTemplate = ref(null);
    const groups = ref([]);
    const flattenedNodes = computed(() => {
      return flattenNodes(groups.value);
    });

    const router = useRouter();
    const projectId = ref(null);
    const projectName = ref("");
    const company = ref("");
    const projectDetails = ref(null);
    function groupBy(array, key) {
      return array.reduce((result, currentItem) => {
        (result[currentItem[key]] = result[currentItem[key]] || []).push(
          currentItem
        );
        return result;
      }, {});
    }

    if (props.mode === "edit") {
      projectId.value = router.currentRoute.value.params.id; // Get the project ID from the route params
      store.fetchProject(projectId.value).then((project) => {
        projectName.value = project.name; // Set the form fields with the project details
        company.value = project.company;
        comment.value = project.comment;
      });
      store.fetchProjectDetails(projectId.value).then((details) => {
        // Transform the project details into the format expected by the q-tree component
        const groupedDetails = groupBy(details, "groupId");
        groups.value = Object.values(groupedDetails).map((groupDetails) => ({
          id: groupDetails[0].groupId,
          label: groupDetails[0].groupName,
          children: groupDetails.map((question) => ({
            id: question.questionId,
            label: question.questionText,
            isTicked: question.isTicked,
          })),
        }));

        // Extract the IDs of the ticked questions and update the `ticked` ref
        const tickedQuestionIds = details
          .filter((detail) => detail.isTicked)
          .map((detail) => detail.questionId);
        ticked.value = tickedQuestionIds;
      });
    }

    const createProject = async () => {
      const projectData = {
        name: projectName.value,
        company: company.value,
        comment: comment.value,
        templateId: selectedTemplate.value.id,
      };
      const newProject = await store.createProject(projectData);

      // Filter out the groups from the flattened nodes
      const questions = flattenedNodes.value.filter(
        (node) => node.children === undefined
      );

      // For each question, create a new entry in the projectsQuestions table
      for (const question of questions) {
        console.log("Creating project question:", question); // Log the question object
        const projectQuestionData = {
          isTicked: ticked.value.includes(question.id), // Use isTicked value from question
          isLocked: false, // False by default, change if needed
          isCompleted: false, // False by default, change if needed
          templateQuestionId: question.id,
          projectId: newProject.id,
        };
        console.log("Project question data:", projectQuestionData); // Log the data to be sent to the server
        await store.createProjectQuestion(projectQuestionData);
      }

      router.back(); // Navigate back after creating project and project questions
    };
    const updateProject = async () => {
      const updatedProject = {
        name: projectName.value,
        company: company.value,
        comment: comment.value,
      };

      await store.updateProject(projectId.value, updatedProject);

      router.back(); // Navigate back after updating project
    };

    // Fetch templates and their details
    const fetchTemplates = async () => {
      if (props.mode === "new") {
        store.installActions([
          {
            label: "CREATE PROJECT",
            callback: createProject,
          },
        ]);

        templates.value = await store.fetchTemplates();
      } else if (props.mode === "edit") {
        store.installActions([
          {
            label: "Save",
            callback: updateProject,
          },
          {
            label: "CLONE",
            callback: () => {
              router.back();
            },
          },
        ]);
      }
    };

    // Fetch template groups and questions
    const fetchTemplateDetails = async () => {
      const templateId = selectedTemplate.value.id;

      // Fetch template groups
      const fetchedGroups = await store.fetchTemplateGroups(templateId);
      groups.value = fetchedGroups.map((group) => ({
        id: group.id,
        label: group.groupName,
        children: [],
      }));

      // Fetch template questions
      for (const group of fetchedGroups) {
        const groupId = group.id;
        const fetchedQuestions = await store.fetchTemplateQuestions(groupId);
        const targetGroup = groups.value.find((g) => g.id === groupId);
        if (targetGroup) {
          targetGroup.children = fetchedQuestions.map((question) => ({
            id: question.id,
            label: question.questionTitle,
            description: question.questionDescription, // Add this line
          }));
        }
      }
    };

    // Function to flatten the groups and their questions for q-tree
    const flattenNodes = (nodes) => {
      const flattened = [];
      for (const node of nodes) {
        // Add isTicked property to each node, set to false by default
        flattened.push({ ...node, isTicked: false });
        if (node.children) {
          flattened.push(...flattenNodes(node.children));
        }
      }
      return flattened;
    };

    // Watch for changes in the selected template
    watch(selectedTemplate, (newValue) => {
      if (newValue) {
        // Fetch template details
        fetchTemplateDetails();
      }
    });

    // Fetch templates on component mount
    fetchTemplates();

    return {
      splitterModel,
      templates,
      selectedNodeId,
      selectedTemplate,
      projectName,
      company,
      groups,
      flattenedNodes,
      props,
      comment,
      projectId,
      saveComment,
      showCommentDialog,
      ticked,
      selected,
      createProject,
      projectDetails,
    };
  },
};
</script>
