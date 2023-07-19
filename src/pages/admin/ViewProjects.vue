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
    const ticked = ref("");
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
    const projectName = ref("");
    const company = ref("");

    // Fetch templates and their details
    const fetchTemplates = async () => {
      if (props.mode === "new") {
        store.installActions([
          {
            label: "CREATE PROJECT",
            callback: () => {
              router.back();
            },
          },
        ]);

        templates.value = await store.fetchTemplates();
      } else if (props.mode === "edit") {
        store.installActions([
          {
            label: "Save",
            callback: () => {
              router.back();
            },
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
        flattened.push(node);
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
      saveComment,
      showCommentDialog,
      ticked,
      selected,
    };
  },
};
</script>
