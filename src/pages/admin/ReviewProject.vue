<template>
  <div>
    <q-card bordered>
      <q-card-section>
        <div class="text-h6">{{ projectName }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col">Total Questions: {{ totalQuestions }}</div>
        <div class="col">Client to Answer: {{ clientToAnswer }}</div>
        <div class="col">Questions for Reviewer: {{ adminToReview }}</div>
        <div class="col">{{ status }}% Completed</div>
      </q-card-section>
    </q-card>
  </div>
  <div>
    <q-splitter v-model="splitterModel" style="height: 800px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            ref="treeRef"
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
            <div class="text-subtitle2 q-mb-xs">Client Answer</div>
            <br />
            <div v-html="latestClientAnswer.response"></div>

            <q-select
              v-model="selectedClientAnswer"
              :options="clientAnswers"
              label="Client"
              style="width: 200px"
              class="q-mb-md"
              @update:model-value="updateClientAnswer"
            />
            <hr />
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Reviewer Comment</div>
              <q-editor
                v-model="reviewerComment"
                class="q-mb-md"
                :dense="$q.screen.lt.md"
              />

              <q-select
                v-model="selectedReviewerComment"
                :options="reviewerResponses"
                label="Reviewer"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateReviewerComment"
              />
            </div>

            <div class="q-mt-md">
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
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";
export default {
  props: {
    id: {
      type: String, // or Number, depending on what type your id is
      required: true,
    },
  },

  setup(props, context) {
    const splitterModel = ref(10);
    const selected = ref(null);
    const reviewerComment = ref("");
    const treeRef = ref(null);
    const authDataString = localStorage.getItem("auth");
    const jsonString = authDataString.replace("__q_objt|", ""); // Remove the Quasar prefix
    const authData = JSON.parse(jsonString);
    const userId = authData.id;

    const clientAnswer = ref("");

    const reviewerComments = ref({});
    const clientAnswers = ref([
      {
        name: "Client 1",
        date: "2023-05-20",
        response: "Client Comment 1",
        label: "Client 1 - 2023-05-10",
      },
      {
        name: "Reviewer 2",
        date: "2023-05-21",
        response: "Client Comment 2",
        label: "Client 2 - 2023-05-11",
      },
    ]);

    const selectedReviewerComment = ref(
      reviewerComments.value[reviewerComments.value.length - 1]
    );
    const selectedClientAnswer = ref(
      clientAnswers.value[clientAnswers.value.length - 1]
    );

    const groups = ref([]);
    const store = useAppStore();
    const router = useRouter();
    const projectId = ref(props.id);

    const fetchProjectSelectedQuestions = async () => {
      if (projectId.value) {
        const projectTickedQuestions =
          await store.fetchProjectSelectedQuestions(projectId.value);
        console.log(projectTickedQuestions); // Log the data

        // Convert the fetched data to the format q-tree expects
        const groupsMap = new Map();
        projectTickedQuestions.forEach((question) => {
          if (!groupsMap.has(question.groupId)) {
            groupsMap.set(question.groupId, {
              label: question.groupName,
              children: [],
            });
          }
          const group = groupsMap.get(question.groupId);
          group.children.push({
            label: question.questionText,
            description: question.comment,
            id: question.projectQuestionId,
          });
        });
        groups.value = Array.from(groupsMap.values());
        treeRef.value.expandAll();
      }
    };
    const fetchProjectDetails = async () => {
      if (projectId.value) {
        store.fetchProject(projectId.value).then((project) => {
          projectName.value = project.name;
        });
      }
    };

    onMounted(async () => {
      try {
        await nextTick();
        fetchProjectDetails();
        fetchProjectSelectedQuestions();
      } catch (error) {
        console.error(error);
      }
    });

    fetchProjectSelectedQuestions();
    const flattenedNodes = computed(() => {
      const nodes = [];
      const traverse = (node) => {
        if (node.children) {
          node.children.forEach(traverse);
        }
        if (node.description) {
          nodes.push(node);
        }
      };
      groups.value.forEach(traverse);
      return nodes;
    });
    const nextQuestion = () => {
      const currentIndex = flattenedNodes.value.findIndex(
        (node) => node.label === selected.value
      );
      const nextIndex = currentIndex + 1;
      if (nextIndex < flattenedNodes.value.length) {
        selected.value = flattenedNodes.value[nextIndex].label;
      }
    };
    const submit = () => {
      console.log("Selected question ID:", selected.value);
      const selectedQuestion = flattenedNodes.value.find(
        (node) => node.label === selected.value
      );
      const commentData = {
        comment: reviewerComment.value,
        projectQuestionId: selectedQuestion.id, // Use the id from projectsQuestions
        userId: userId, // Use the actual user ID
      };

      store
        .submitComment(commentData)
        .then((result) => {
          console.log("Comment submitted with ID:", result.id);
          nextQuestion();
        })
        .catch((error) => {
          console.error("Error submitting comment:", error);
        });
    };

    const updateReviewerComment = (selectedObject) => {
      reviewerComment.value = selectedObject ? selectedObject.response : "";
    };

    const updateClientAnswer = (selectedObject) => {
      clientAnswer.value = selectedObject ? selectedObject.response : "";
    };
    onMounted(async () => {
      try {
        await nextTick();
        fetchProjectSelectedQuestions();
      } catch (error) {
        console.error(error);
      }
    });

    onMounted(() => {
      if (reviewerComments.value[selected.value]) {
        const latestResponse =
          reviewerComments.value[selected.value][
            reviewerComments.value[selected.value].length - 1
          ];
        reviewerComment.value = latestResponse.response;
        selectedReviewerComment.value = latestResponse;
      }
    });
    watch(
      () => router.currentRoute.value,
      async (newRoute) => {
        projectId.value = newRoute.params.id;
        await fetchProjectSelectedQuestions();
      }
    );

    watch(reviewerComments, (newVal) => {
      if (newVal[selected.value]) {
        selectedReviewerComment.value =
          newVal[selected.value][newVal[selected.value].length - 1];
      }
    });
    const reviewerResponses = computed(() => {
      return reviewerComments.value[selected.value] || [];
    });
    watch(selected, (newVal) => {
      if (reviewerComments.value[newVal]) {
        const latestResponse =
          reviewerComments.value[newVal][
            reviewerComments.value[newVal].length - 1
          ];
        reviewerComment.value = latestResponse.response;
        selectedReviewerComment.value = latestResponse;
      } else {
        reviewerComment.value = "";
        selectedReviewerComment.value = null;
      }
    });

    const latestClientAnswer = computed(() => {
      return clientAnswers.value[clientAnswers.value.length - 1];
    });
    const projectName = ref("Project Title");
    const totalQuestions = ref(300);
    const clientToAnswer = ref(150);
    const adminToReview = ref(50);
    const status = ref(50); // You can calculate this based on your data
    return {
      splitterModel,
      selected,
      groups,
      flattenedNodes,
      reviewerComment,
      clientAnswer,
      reviewerComments,
      clientAnswers,
      selectedReviewerComment,
      selectedClientAnswer,
      submit,
      nextQuestion,
      updateReviewerComment,
      updateClientAnswer,
      treeRef,
      projectName,
      totalQuestions,
      clientToAnswer,
      adminToReview,
      status,
      reviewerResponses,
      latestClientAnswer,
    };
  },
};
</script>
