import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
const axios = require("axios");

export const useAppStore = defineStore("appStore", {
  state: () => ({
    dynamicActions: [],
    auth: LocalStorage.getItem("auth") || null,
    usersData: [],
    groupsData: [],
    projectData: [],
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

    fetchUsers() {
      axios
        .get("http://localhost:3000/users")
        .then((response) => {
          this.usersData = response.data;

          this.usersData.forEach((user) => {
            axios
              .get(`http://localhost:3000/users/${user.id}/projects`)
              .then((response) => {
                user.projects = response.data;
              });
          });
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
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

    insertNewProject(newProject) {
      axios
        .post("http://localhost:3000/projects", newProject)
        .then((response) => {
          console.log("Project created with ID:", response.data.id);
          this.projectData.push(response.data);
        })
        .catch((error) => {
          console.error("Error creating project:", error);
        });
    },

    fetchGroups() {
      return axios
        .get("http://localhost:3000/groups")
        .then((response) => {
          this.groupsData = response.data.map((group) => {
            return {
              ...group,
              children: JSON.parse(group.children),
            };
          });
        })
        .catch((error) => {
          console.error("Error fetching groups:", error);
        });
    },

    saveGroups(groups) {
      axios
        .post("http://localhost:3000/groups", {
          ...groups,
          children: JSON.stringify(groups.children),
        })
        .then((response) => {
          this.groupsData = response.data;
        })
        .catch((error) => {
          console.error("Error saving groups:", error);
        });
    },
    createGroup(group) {
      axios
        .post("http://localhost:3000/groups", {
          ...group,
          children: JSON.stringify(group.children),
        })
        .then((response) => {
          this.groupsData.push(response.data);
        })
        .catch((error) => {
          console.error("Error creating group:", error);
        });
    },
    updateGroup(id, group) {
      axios
        .put(`http://localhost:3000/groups/${id}`, {
          ...group,
          children: JSON.stringify(group.children),
        })
        .then((response) => {
          const index = this.groupsData.findIndex((g) => g.id === id);
          if (index !== -1) {
            this.groupsData.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error updating group:", error);
        });
    },

    deleteGroup(id) {
      axios
        .delete(`http://localhost:3000/groups/${id}`)
        .then(() => {
          const index = this.groupsData.findIndex((g) => g.id === id);
          if (index !== -1) {
            this.groupsData.splice(index, 1);
          }
        })
        .catch((error) => {
          console.error("Error deleting group:", error);
        });
    },
    updateUserProjects(userId, projectIds) {
      axios
        .put(`http://localhost:3000/users/${userId}/projects`, {
          projects: projectIds,
        })
        .then((response) => {
          console.log("User's projects updated with ID:", response.data.userId);
          // Update the usersData array in the store
          const user = this.usersData.find((u) => u.id === userId);
          if (user) {
            user.projects = response.data.projects;
          }
        })
        .catch((error) => {
          console.error("Error:", error);
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
          // Update the usersData array in the store
          const index = this.usersData.findIndex((u) => u.id === userId);
          if (index !== -1) {
            this.usersData.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    getUserProjects(userId) {
      return axios
        .get(`http://localhost:3000/users/${userId}/projects`)
        .then((response) => {
          // The server returns an array of projects
          // Each project is an object with an id property
          const projects = response.data;

          // Map the projects to their ids
          const projectIds = projects.map((project) => project.id);

          return projectIds;
        })
        .catch((error) => {
          console.error("Error fetching user projects:", error);
        });
    },

    fetchProjects() {
      axios
        .get("http://localhost:3000/projects")
        .then((response) => {
          this.projectData = response.data;
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
        });
    },

    initProjects() {
      this.fetchProjects();
    },
    // Action to update a project
    updateProject(projectId, updatedProject) {
      axios
        .put(`http://localhost:3000/projects/${projectId}`, updatedProject)
        .then((response) => {
          console.log("Project updated with ID:", response.data.id);
          const index = this.projectData.findIndex(
            (p) => p.id === response.data.id
          );
          if (index !== -1) {
            this.projectData.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error updating project:", error);
        });
    },
    editUser(router, info) {
      router.push(`/admin/user/edit/${info.id}`);
    },

    mapUserRecords() {
      const usersData = this.usersData;

      return usersData.map((user) => {
        // Fetch the assigned projects for the user
        axios;

        return user;
      });
    },

    reviewProject(router, info) {
      router.push(`/admin/project/review/${info.id}`);
    },

    editProject(router, info) {
      router.push(`/admin/project/edit/${info.id}`);
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
