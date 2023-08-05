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
          <q-input outlined v-model="search" label="Search" />
          <q-tree
            ref="treeRef"
            :nodes="filteredGroups"
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
            <div
              v-if="selectedClientAnswer"
              v-html="selectedClientAnswer.value"
            ></div>

            <q-select
              v-model="selectedClientAnswer"
              :options="selectedQuestionAnswers"
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
                :options="reviewerCommentsOptions"
                label="Reviewer"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateReviewerComment"
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
              <q-btn label="Next" color="primary" @click="nextQuestion" />
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
    const search = ref("");
    const filteredQuestions = computed(() => {
      return flattenedNodes.value.filter((node) =>
        node.label.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const reviewerComment = ref("");
    const treeRef = ref(null);
    const authDataString = localStorage.getItem("auth");
    const jsonString = authDataString.replace("__q_objt|", ""); // Remove the Quasar prefix
    const authData = JSON.parse(jsonString);
    const userId = authData.id;
    const resetSearch = () => {
      fetchProjectSelectedQuestions();
    };
    const reviewerComments = ref([]);
    const lock = ref(false);
    const completed = ref(false);
    const selectedReviewerComment = ref({ label: "", value: { label: "" } });
    const selectedQuestionAnswers = computed(() => {
      return questionToClientAnswers.value[selected.value] || [];
    });
    const questionToClientAnswers = computed(() => {
      const mapping = {};
      flattenedNodes.value.forEach((node) => {
        const projectQuestionId = node.id; // Get the projectQuestionId for each question
        const answers = clientAnswers.value.filter(
          (answer) => answer.projectQuestionId === projectQuestionId
        );
        mapping[node.label] = answers || [];
      });
      return mapping;
    });
    const questionToReviewerComments = computed(() => {
      const mapping = {};
      flattenedNodes.value.forEach((node) => {
        const projectQuestionId = node.id; // Get the projectQuestionId for each question
        const comments = reviewerComments.value.filter(
          (comment) => comment.projectQuestionId === projectQuestionId
        );
        mapping[node.label] = comments || [];
      });
      return mapping;
    });

    const clientAnswer = ref("");
    const isLocked = ref("");
    const isComplete = ref("");

    const clientAnswers = ref([]);
    const selectedClientAnswer = ref({});

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

          // Fetch the latest reviewer comments from the server
          store
            .fetchProjectReviewerComments(projectId.value)
            .then((comments) => {
              reviewerComments.value = comments;
            });

          nextQuestion();
        })
        .catch((error) => {
          console.error("Error submitting comment:", error);
        });
    };
    const updateReviewerComment = (newVal) => {
      selectedReviewerComment.value = newVal;
      reviewerComment.value = newVal.value; //
    };

    const updateClientAnswer = (selectedObject) => {
      selectedClientAnswer.value = selectedObject;
      clientAnswer.value = selectedObject ? selectedObject.value : "";
    };
    const filteredGroups = computed(() => {
      return groups.value
        .map((group) => {
          const filteredChildren = group.children.filter((child) =>
            child.label.toLowerCase().includes(search.value.toLowerCase())
          );
          return { ...group, children: filteredChildren };
        })
        .filter((group) => group.children.length > 0); // Only include groups with at least one child
    });

    watch(
      () => router.currentRoute.value,
      async (newRoute) => {
        projectId.value = newRoute.params.id;
        await resetSearch();
      }
    );
    watch(
      () => router.currentRoute.value,
      async (newRoute) => {
        projectId.value = newRoute.params.id;
        await fetchProjectSelectedQuestions();
      }
    );
    watch(selected, (newVal) => {
      // Set the default 'selectedReviewerComment' to the latest comment submitted for the selected question
      const selectedQuestionComments = questionToReviewerComments.value[newVal];
      if (selectedQuestionComments && selectedQuestionComments.length > 0) {
        const latestResponse =
          selectedQuestionComments[selectedQuestionComments.length - 1];
        reviewerComment.value = latestResponse.comment;
        selectedReviewerComment.value = {
          label: `${latestResponse.userEmail} - ${new Date(
            latestResponse.timestamp
          ).toLocaleString()}`,
          value: latestResponse.comment,
        };
      } else {
        reviewerComment.value = "";
        selectedReviewerComment.value = { label: "", value: "" };
      }
      const selectedQuestionAnswers = questionToClientAnswers.value[newVal];
      if (selectedQuestionAnswers && selectedQuestionAnswers.length > 0) {
        const latestAnswer =
          selectedQuestionAnswers[selectedQuestionAnswers.length - 1];
        console.log("latestAnswer:", latestAnswer);
        selectedClientAnswer.value = {
          label: latestAnswer.label,
          value: latestAnswer.value,
        };
      } else {
        selectedClientAnswer.value = { label: "", value: "" };
      }
      console.log(
        "updated selectedClientAnswer.value:",
        selectedClientAnswer.value
      );
    });
    const reviewerCommentsOptions = computed(() => {
      if (!selected.value) {
        // Return an empty array or handle the case when selected is null
        return [];
      }

      const selectedQuestionComments =
        questionToReviewerComments.value[selected.value];
      return selectedQuestionComments.map((comment) => ({
        label: `${comment.userEmail} - ${new Date(
          comment.timestamp
        ).toLocaleString()}`,
        value: comment.comment, // Use comment.comment instead of comment
      }));
    });
    onMounted(async () => {
      try {
        await nextTick();
        fetchProjectDetails();
        fetchProjectSelectedQuestions();
        store.fetchProjectReviewerComments(projectId.value).then((comments) => {
          reviewerComments.value = comments;
          console.log(
            "reviewerCommentsOptions:",
            reviewerCommentsOptions.value
          );
          console.log("flattenedNodes:", flattenedNodes.value);

          if (flattenedNodes.value.length > 0) {
            selected.value = flattenedNodes.value[0].label;

            const selectedQuestionComments =
              questionToReviewerComments.value[selected.value];
            if (
              selectedQuestionComments &&
              selectedQuestionComments.length > 0
            ) {
              const latestResponse =
                selectedQuestionComments[selectedQuestionComments.length - 1];
              reviewerComment.value = latestResponse.comment;
              selectedReviewerComment.value = latestResponse;
            } else {
              reviewerComment.value = "";
              selectedReviewerComment.value = { label: "", value: "" };
            }
          }

          console.log(
            "selectedReviewerComment:",
            selectedReviewerComment.value
          );
        });
        store
          .fetchProjectClientAnswers(projectId.value)
          .then((clientAnswerData) => {
            clientAnswers.value = clientAnswerData.map((answer) => ({
              label: `${answer.userEmail} - ${new Date(
                answer.timestamp
              ).toLocaleString()}`,
              value: answer.comment,

              projectQuestionId: answer.projectQuestionId,
            }));

            const selectedQuestionAnswers =
              questionToClientAnswers.value[selected.value];
            if (selectedQuestionAnswers && selectedQuestionAnswers.length > 0) {
              const latestAnswer =
                selectedQuestionAnswers[selectedQuestionAnswers.length - 1];
              selectedClientAnswer.value = latestAnswer;
            } else {
              selectedClientAnswer.value = { label: "", value: "" };
            }
          });
      } catch (error) {
        console.error(error);
      }
    });

    const projectName = ref("Project Title");
    const totalQuestions = computed(() => {
      let count = 0;
      groups.value.forEach((group) => {
        count += group.children.length;
      });
      return count;
    });

    const clientToAnswer = ref(150);
    const adminToReview = ref(50);
    const status = ref(50); // You can calculate this based on your data
    return {
      splitterModel,
      selected,
      groups,
      flattenedNodes,
      search,
      filteredQuestions,
      reviewerComment,
      clientAnswer,
      reviewerComments,
      clientAnswers,
      selectedReviewerComment,
      questionToClientAnswers,
      selectedQuestionAnswers,
      selectedClientAnswer,
      submit,
      nextQuestion,
      updateReviewerComment,
      updateClientAnswer,
      treeRef,
      projectName,
      totalQuestions,
      clientToAnswer,
      filteredGroups,
      adminToReview,
      status,
      reviewerCommentsOptions,
      resetSearch,
      questionToReviewerComments,
      isLocked,
      isComplete,
    };
  },
};
</script>
