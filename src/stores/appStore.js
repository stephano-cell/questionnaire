import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
const axios = require("axios");

export const useAppStore = defineStore("appStore", {
  state: () => ({
    dynamicActions: [],
    auth: LocalStorage.getItem("auth") || null,
    usersData: [],
    templateGroups: [],
    templateQuestions: [],
    template: [],
    projects: [],
    projectsQuestions: [],
    reviewerComments: [],
    clientAnswers: [],
    assignedProjects: [],
  }),

  getters: {
    getActions() {
      var id = 1;
      const actions =
        this.dynamicActions?.map((a) => {
          a.id = id++;
          return a;
        }) ?? [];
      return actions;
    },
    authenticated() {
      console.log("Authenticated: " + (this.auth != null ? "yes" : "no"));
      return this.auth;
    },
    getUserEmail: (state) => (userId) => {
      const userOption = state.userOptions.find(
        (option) => option.value === userId
      );
      return userOption ? userOption.label : "";
    },
  },
  actions: {
    getUserByID(id) {
      const user = this.usersData.find((u) => u.id === id);
      if (!user) {
        return null;
      } else {
        return user;
      }
    },

    async fetchUsers() {
      return axios
        .get("http://localhost:3000/users")
        .then((response) => {
          this.usersData = response.data;
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching template:", error);
        });
    },

    insertNewUser(user, selectedProjects) {
      // Create a new user and insert it into the database
      axios
        .post("http://localhost:3000/register", {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          companyName: user.companyName,
          password: user.password,
          role: user.role,
          allowLogin: user.allowLogin,
        })
        .then((response) => {
          const userId = response.data.id;
          console.log("User created with ID:", userId);

          // Assign the selected projects to the new user if any projects are selected
          if (selectedProjects && selectedProjects.length > 0) {
            selectedProjects.forEach((projectId) => {
              // Renamed 'project' to 'projectId' for clarity
              axios
                .post("http://localhost:3000/assign", {
                  userId: userId,
                  projectId: projectId, // Use the project ID directly
                })
                .then(() => {
                  console.log(
                    `Project ${projectId} assigned to user ${userId}`
                  );
                })
                .catch((error) => {
                  console.error("Error assigning project:", error);
                });
            });
          }
        })
        .catch((error) => {
          console.error("Error creating user:", error);
        });
    },

    updateUser(userId, updatedUser) {
      console.log("User ID:", userId);
      axios
        .put(`http://localhost:3000/users/${userId}`, {
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          companyName: updatedUser.companyName,
          password: updatedUser.password,
          role: updatedUser.role,
          allowLogin: updatedUser.allowLogin,
        })
        .then((response) => {
          console.log("Server response:", response.data);
          console.log("User updated with ID:", response.data.id);
          // Update the usersData array in the storeserRecords() {
          const index = this.usersData.findIndex((u) => u.id === userId);
          if (index !== -1) {
            this.usersData.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    editUser(router, info) {
      router.push(`/admin/user/edit/${info.id}`);
    },

    //templates

    fetchTemplates() {
      return axios
        .get("http://localhost:3000/template/list")
        .then((response) => {
          console.log("Fetched templates:", response.data);
          this.template = response.data;
          return response.data; // Return the fetched templates
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          throw error; // Re-throw the error to propagate it to the caller
        });
    },

    postNewTemplate(templateData) {
      console.log("Template Data:", templateData); // Add this line

      return axios
        .post("http://localhost:3000/template/new", templateData)
        .then((response) => {
          console.log("New template created with ID:", response.data.id);
          this.fetchTemplates(); // Fetch the templates again
          return { id: response.data.id }; // Return an object with the templateId
        })
        .catch((error) => {
          console.error("Error creating new template:", error);
        });
    },

    postNewTemplateGroup(groupData) {
      console.log("Group Data:", groupData);

      return axios
        .post("http://localhost:3000/templateGroups/new", groupData)
        .then((response) => {
          console.log("New group created with ID:", response.data.id);
          return response; // Return only the data from the response
        })
        .catch((error) => {
          console.error("Error creating new group:", error);
          return Promise.reject(error);
        });
    },

    postNewTemplateQuestion(questionData) {
      console.log("Question Data:", questionData);

      return axios
        .post("http://localhost:3000/templateQuestions/new", questionData)
        .then((response) => {
          console.log("New question created with ID:", response.data.id);
          return response; // Return only the data from the response
        })
        .catch((error) => {
          console.error("Error creating new question:", error);
          return Promise.reject(error);
        });
    },

    //editTemplate
    editTemplate(router, info) {
      router.push(`/admin/template/edit/${info.id}`);
    },
    async fetchTemplate(id) {
      return axios
        .get(`http://localhost:3000/template/${id}`)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching template:", error);
        });
    },
    async fetchTemplateGroups(templateId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/templateGroups/${templateId}`
        );
        console.log("Fetched groups:", response.data); // Add this line to check the fetched groups
        return response.data;
      } catch (error) {
        console.error("Error fetching template groups:", error);
        return [];
      }
    },
    async fetchProjectsByTemplateId(templateId) {
      const response = await fetch(
        `http://localhost:3000/projects/template/${templateId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    async fetchTemplateQuestions(groupId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/templateQuestions/${groupId}`
        );
        console.log("Fetched questions:", response.data); // Add this line to check the fetched questions
        return response.data;
      } catch (error) {
        console.error("Error fetching template questions:", error);
        return [];
      }
    },

    async updateTemplate(id, data) {
      await axios
        .put(`http://localhost:3000/template/${id}`, data)
        .then((response) => {
          console.log("Template updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating template:", error);
        });
    },

    async updateTemplateGroup(id, data) {
      await axios
        .put(`http://localhost:3000/templateGroups/${id}`, data)
        .then((response) => {
          console.log("Group updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating group:", error);
        });
    },

    async updateTemplateQuestion(id, data) {
      await axios
        .put(`http://localhost:3000/templateQuestions/${id}`, data)
        .then((response) => {
          console.log("Question updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating question:", error);
        });
    },

    //createProject
    createProject(projectData) {
      return axios
        .post("http://localhost:3000/projects/new", projectData)
        .then((response) => {
          console.log("New project created with ID:", response.data.id);
          return { id: response.data.id };
        })
        .catch((error) => {
          console.error("Error creating new project:", error);
        });
    },
    async createProjectQuestion(questionData) {
      try {
        const response = await axios.post(
          "http://localhost:3000/projectsQuestions/new",
          questionData
        );
        console.log("New project question created with ID:", response.data.id);
        return { id: response.data.id };
      } catch (error) {
        console.error("Error creating new project question:", error);
        throw error;
      }
    },

    fetchProjects() {
      return axios
        .get("http://localhost:3000/projects")
        .then((response) => {
          console.log("Fetched projects:", response.data); // Log the fetched projects
          this.projects = response.data;
          return this.projects;
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
          return []; // Return an empty array on error
        });
    },
    //fetcing when editing a Project ViewProjects.vue
    fetchProject(projectId) {
      return axios
        .get(`http://localhost:3000/projects/${projectId}`)
        .then((response) => {
          console.log("Fetched project:", response.data);
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching project:", error);
          throw error; // Re-throw the error to propagate it to the caller
        });
    },
    fetchProjectDetails(projectId) {
      return axios
        .get(`http://localhost:3000/projects/${projectId}/details`)
        .then((response) => {
          console.log("Fetched project details:", response.data);
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching project details:", error);
          throw error; // Re-throw the error to propagate it to the caller
        });
    },

    //edit project

    editProject(router, info) {
      router.push(`/admin/project/edit/${info.id}`);
    },
    //admin
    reviewProject(router, info) {
      router.push(`/admin/project/review/${info.id}`);
    },
    //client
    answerProject(router, info) {
      router.push(`/session/answer/${info.id}`);
    },

    updateProject(projectId, updatedProject) {
      console.log("Project ID:", projectId);
      axios
        .put(`http://localhost:3000/projects/${projectId}`, {
          name: updatedProject.name,
          company: updatedProject.company,
          comment: updatedProject.comment,
        })
        .then((response) => {
          console.log("Server response:", response.data);
          console.log("Project updated with ID:", response.data.id);
          // Update the projects array in the store
          const index = this.projects.findIndex((p) => p.id === projectId);
          if (index !== -1) {
            this.projects.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    async updateProjectQuestion(id, questionData) {
      await axios
        .put(`http://localhost:3000/projectsQuestions/${id}`, questionData)
        .then((response) => {
          console.log("Updated project question with ID:", id);
          console.log("Server response:", response.data);
        })
        .catch((error) => {
          console.error("Error updating project question:", error);
        });
    },
    //reviewproject
    async fetchProjectSelectedQuestions(projectId) {
      const response = await axios.get(
        `http://localhost:3000/projects/${projectId}/selected-questions`
      );
      if (response.status === 200) {
        return response.data;
      }
      throw new Error("Failed to fetch project selected questions");
    },
    submitComment(commentData) {
      console.log("Submitting comment data:", commentData); // Log the commentData

      return axios
        .post("http://localhost:3000/projectsReviewerComments/new", commentData)
        .then((response) => {
          console.log("New comment submitted with ID:", response.data.id);
          return { id: response.data.id };
        })
        .catch((error) => {
          console.error(
            "Error submitting new comment:",
            error.response.data.error
          );
        });
    },

    async fetchProjectReviewerComments(projectId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/projects/${projectId}/reviewer-comments`
        );
        console.log("Fetched reviewer comments:", response.data);
        this.reviewerComments = response.data; // Store the comments in the state
        return response.data;
      } catch (error) {
        console.error("Error fetching reviewer comments:", error);
        throw error;
      }
    },
    lockQuestion(questionId, isLocked) {
      return axios
        .put(`http://localhost:3000/projectsQuestions/${questionId}/lock`, {
          isLocked,
        })
        .then((response) => {
          console.log(
            `Question ${questionId} locked status updated to: ${isLocked}`
          );
          return response.data;
        })
        .catch((error) => {
          console.error(
            `Error updating lock status for question ${questionId}:`,
            error.response.data.error
          );
        });
    },
    completeQuestion(questionId, isCompleted) {
      return axios
        .put(`http://localhost:3000/projectsQuestions/${questionId}/complete`, {
          isCompleted,
        })
        .then((response) => {
          console.log(
            `Question ${questionId} complete status updated to: ${isCompleted}`
          );
          return response.data;
        })
        .catch((error) => {
          console.error(
            `Error updating complete status for question ${questionId}:`,
            error.response.data.error
          );
        });
    },

    //client answers
    async fetchProjectClientAnswers(projectId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/projects/${projectId}/client-answers`
        );
        console.log("Fetched client answers:", response.data);
        this.clientAnswers = response.data; // Store the comments in the state
        return response.data;
      } catch (error) {
        console.error("Error fetching client answers:", error);
        throw error;
      }
    },

    //client submit answer
    submitAnswer(answerData) {
      console.log("Submitting answer data:", answerData); // Log the commentData

      return axios
        .post("http://localhost:3000/projectsClientAnswers/new", answerData)
        .then((response) => {
          console.log("New comment submitted with ID:", response.data.id);
          return { id: response.data.id };
        })
        .catch((error) => {
          console.error(
            "Error submitting new answer:",
            error.response.data.error
          );
        });
    },

    //usersProjects

    assignProjectsToUser(userId, projectObjects) {
      const projectIds = projectObjects.map((p) => p.id);
      console.log(`Assigning projects to user ${userId}:`, projectIds);

      const validProjects = projectIds.filter(
        (p) => p !== null && p !== undefined
      );

      if (!validProjects || validProjects.length === 0) {
        console.log("No projects to assign.");
        return;
      }

      const endpoint = `http://localhost:3000/users/${userId}/assign`;
      const payload = { projects: [...validProjects] };
      console.log(`Sending PUT request to ${endpoint} with payload:`, payload);

      return axios
        .put(endpoint, payload)
        .then((response) => {
          console.log(`Projects assigned to user with ID: ${response.data.id}`);
        })
        .catch((error) => {
          console.error("Error assigning projects to user:", error);
        });
    },

    unassignProjectsFromUser(userId, projectIds) {
      console.log(`Unassigning projects from user ${userId}:`, projectIds);

      if (!projectIds || projectIds.length === 0) {
        console.log("No projects to unassign.");
        return;
      }

      return axios
        .put(`http://localhost:3000/users/${userId}/unassign`, {
          projects: projectIds,
        })
        .then((response) => {
          console.log(
            `Projects unassigned from user with ID: ${response.data.id}`
          );
        })
        .catch((error) => {
          console.error("Error unassigning projects from user:", error);
        });
    },

    getProjectsAssignedToUser(userId) {
      return axios
        .get(`http://localhost:3000/users/${userId}/projects`)
        .then((response) => {
          console.log(`Fetched projects assigned to user with ID: ${userId}`);
          this.assignedProjects = response.data; // Update the state
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching projects assigned to user:", error);
        });
    },
    async fetchAllUsersWithProjects() {
      try {
        const response = await axios.get(
          "http://localhost:3000/users-with-projects"
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching all users with projects:", error);
        throw error;
      }
    },
    logout() {
      console.log("Logout");
      this.auth = null;
      LocalStorage.remove("auth");
    },
    authenticate(username, pass) {
      return axios
        .post("http://localhost:3000/login", {
          username: username,
          password: pass,
        })
        .then((response) => {
          const user = response.data;

          this.auth = {
            id: user.id,
            type: user.role,
            token: user.token,
          };

          LocalStorage.set("auth", this.auth);
        })
        .catch((error) => {
          console.error("Error:", error);
          this.auth = null;
        });
    },
    installActions(actions) {
      this.dynamicActions = actions ?? [];
    },
  },
});
