<template>
  <div>
    <q-card bordered>
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">{{ projectName }}</div>
        <q-btn-dropdown unelevated color="primary" label="Export">
          <q-list>
            <q-item
              clickable
              v-close-popup
              @click="
                exportOption = 'With Reviewer Comments';
                exportData();
              "
            >
              <q-item-section>
                <q-item-label>With Reviewer Comments</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="
                exportOption = 'Without Reviewer Comments';
                exportData();
              "
            >
              <q-item-section>
                <q-item-label>Without Reviewer Comments</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-section>
      <q-separator />
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col">Total Questions: {{ totalQuestions }}</div>
        <div class="col">Client to Answer: {{ clientToAnswer }}</div>
        <div class="col">Admin to Review: {{ adminToReview }}</div>
        <div class="col">{{ progress }}% Completed</div>
      </q-card-section>
    </q-card>
  </div>
  <div>
    <q-splitter v-model="splitterModel" style="height: 800px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            :nodes="groups"
            node-key="label"
            selected-color="primary"
            v-model:selected="selected"
            default-expand-all
          />
        </div>
      </template>

      <template v-slot:after>
        <q-tab-panels
          v-model="selected"
          animated
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel
            v-for="node in flattenedNodes"
            :key="node.label"
            :name="node.label"
          >
            <div class="text-h4 q-mb-md">{{ node.label }}</div>
            <p v-html="node.description"></p>

            <div class="q-mt-md">
              <br />
              <div class="text-subtitle2 q-mb-xs">Client Answer</div>
              <br />
              <div v-html="clientResponse" class="q-mb-md"></div>

              <q-select
                v-model="selectedClientResponse"
                :options="clientResponses"
                label="Client"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateClientResponse"
              />
              <div class="text-subtitle2 q-mb-xs">Reviewer Comment</div>
              <q-editor
                v-model="reviewerResponse"
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
              <q-select
                v-model="selectedReviewerResponse"
                :options="reviewerResponses"
                label="Reviewer"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateReviewerResponse"
              />
            </div>

            <div class="q-mt-md">
              <div class="q-mb-md">
                <q-checkbox
                  v-model="isLocked"
                  color="primary"
                  label="Lock"
                  class="text-bold q-mr-md"
                />
                <q-checkbox
                  v-model="isComplete"
                  color="secondary"
                  label="Complete"
                  class="text-bold"
                />
              </div>

              <q-btn
                label="Submit"
                color="primary"
                @click="submit"
                class="q-mr-md"
              />
              <q-btn label="Next" color="secondary" @click="nextQuestion" />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";

export default {
  setup() {
    const splitterModel = ref(20);
    const selected = ref(null);
    const clientResponse = ref("");
    const reviewerResponse = ref("");
    const appStore = useAppStore();
    appStore.initProjects();
    const router = useRouter();
    const projectId = router.currentRoute.value.params.id;
    const projectData = appStore.projectData.find(
      (project) => project.id === projectId
    );
    if (!projectData) {
      throw new Error("Data not found refresh");
    }
    const projectName = ref(projectData.projectName);

    const isLocked = ref(false);
    const isComplete = ref(false);

    const clientResponses = ref([
      {
        name: "Client 1",
        date: "2023-05-18",
        response: "Client Response 1",
        label: "Client 1 - 2023-05-10",
      },
      {
        name: "Client 2",
        date: "2023-05-19",
        response: "Client Response 2",
        label: "Client 2 - 2023-05-08",
      },
    ]);

    const reviewerResponses = ref([
      {
        name: "Reviewer 1",
        date: "2023-05-20",
        response: "Reviewer Comment 1",
        label: "Reviewer 1 - 2023-05-10",
      },
      {
        name: "Reviewer 2",
        date: "2023-05-21",
        response: "Reviewer Comment 2",
        label: "Reviewer 2 - 2023-05-09",
      },
    ]);

    const selectedClientResponse = ref(
      clientResponses.value[clientResponses.value.length - 1]
    );
    const selectedReviewerResponse = ref(
      reviewerResponses.value[reviewerResponses.value.length - 1]
    );

    // Compute the groups and flattenedNodes properties
    // Compute the groups and flattenedNodes properties
    const groups = computed(() => {
      const filteredGroups = projectData.groups.map((group) => {
        const filteredQuestions = group.children.filter(
          (question) => question.ticked
        );
        return { ...group, children: filteredQuestions };
      });

      return filteredGroups.filter((group) => group.children.length > 0);
    });

    const flattenedNodes = computed(() => {
      const nodes = [];

      const traverse = (node) => {
        if (node.children) {
          const filteredChildren = node.children.filter(
            (child) => child.ticked
          );
          filteredChildren.forEach(traverse);
        }

        if (node.description && node.ticked) {
          nodes.push(node);
        }
      };

      groups.value.forEach((group) => {
        traverse(group);
      });

      return nodes;
    });

    const submit = () => {
      const reviewerNameDate = `Reviewer X - ${
        new Date().toISOString().split("T")[0]
      }`;

      reviewerResponses.value.push({
        name: "Reviewer X",
        date: new Date().toISOString().split("T")[0],
        response: reviewerResponse.value,
        label: reviewerNameDate,
      });

      selectedReviewerResponse.value =
        reviewerResponses.value[reviewerResponses.value.length - 1];
    };

    const nextQuestion = () => {
      const currentIndex = flattenedNodes.value.findIndex(
        (node) => node.label === selected.value
      );
      const nextIndex = currentIndex + 1;
      if (nextIndex < flattenedNodes.value.length) {
        selected.value = flattenedNodes.value[nextIndex].label;
      }
    };

    const updateClientResponse = (selectedObject) => {
      clientResponse.value = selectedObject ? selectedObject.response : "";
    };

    const updateReviewerResponse = (selectedObject) => {
      reviewerResponse.value = selectedObject ? selectedObject.response : "";
    };

    onMounted(() => {
      clientResponse.value = selectedClientResponse.value.response;
      reviewerResponse.value = selectedReviewerResponse.value.response;
    });

    const totalQuestions = ref(300);
    const clientToAnswer = ref(150);
    const adminToReview = ref(50);
    const progress = ref(10); // You can calculate this based on your data
    const exportOption = ref("With Reviewer Comments");

    const exportData = () => {
      const data = flattenedNodes.value
        .map(
          (node) => `
        <h1>${node.label}</h1>
        <p>${node.description}</p>
        <p>${
          clientResponses.value.find((response) => response.name === node.label)
            ?.response || "No answer"
        }</p>
        ${
          exportOption.value === "With Reviewer Comments"
            ? `
          <div style="border: 1px solid black; padding: 10px; margin-top: 10px;">
            <strong>Reviewer:</strong>
            <p>${
              reviewerResponses.value.find(
                (response) => response.name === node.label
              )?.response || "No comment"
            }</p>
          </div>
        `
            : ""
        }
      `
        )
        .join("");

      const exportWindow = window.open("", "_blank");
      exportWindow.document.write(data);
      exportWindow.document.close();
    };

    return {
      splitterModel,
      selected,
      groups,
      flattenedNodes,
      clientResponse,
      reviewerResponse,
      clientResponses,
      reviewerResponses,
      selectedClientResponse,
      selectedReviewerResponse,
      submit,
      nextQuestion,
      updateClientResponse,
      updateReviewerResponse,
      isLocked,
      isComplete,
      projectName,
      totalQuestions,
      clientToAnswer,
      adminToReview,
      progress,
      exportOption,
      exportData,
    };
  },
};
</script>
