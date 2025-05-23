document.addEventListener('DOMContentLoaded', function() {
  const goalInput = document.getElementById('goalInput');
  const reminderTime = document.getElementById('reminderTime');
  const addGoalBtn = document.getElementById('addGoal');
  const testNotificationBtn = document.getElementById('testNotification');
  const goalList = document.getElementById('goalList');
  const status = document.getElementById('status');

  // Load existing goals when popup opens
  loadGoals();

  // Add goal button click handler
  addGoalBtn.addEventListener('click', function() {
    const goalText = goalInput.value.trim();
    const time = reminderTime.value;
    const frequency = document.getElementById('frequency').value;
    
    if (goalText) {
      addGoal(goalText, time, frequency);
      goalInput.value = '';
      showStatus('Goal added successfully!');
    } else {
      showStatus('Please enter a goal!');
    }
  });

  // Test notification button
  testNotificationBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({
      action: 'showTestNotification',
      goal: goalInput.value || 'Sample goal reminder!'
    });
    showStatus('Test notification sent!');
  });

  // Enter key handler for goal input
  goalInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addGoalBtn.click();
    }
  });

  function addGoal(goalText, time, frequency) {
    const goal = {
      id: Date.now(),
      text: goalText,
      time: time,
      frequency: frequency,
      created: new Date().toISOString()
    };

    // Save to storage
    chrome.storage.sync.get(['goals'], function(result) {
      const goals = result.goals || [];
      goals.push(goal);
      chrome.storage.sync.set({ goals: goals }, function() {
        loadGoals();
        // Update alarms in background script
        chrome.runtime.sendMessage({ action: 'updateAlarms' });
      });
    });
  }

  function loadGoals() {
    chrome.storage.sync.get(['goals'], function(result) {
      const goals = result.goals || [];
      displayGoals(goals);
    });
  }

  function displayGoals(goals) {
    goalList.innerHTML = '';
    
    if (goals.length === 0) {
      goalList.innerHTML = '<div style="text-align: center; color: #999;">No goals added yet</div>';
      return;
    }

    goals.forEach(function(goal) {
      const goalItem = document.createElement('div');
      goalItem.className = 'goal-item';
      goalItem.innerHTML = `
        <div class="goal-text">
          <strong>${goal.text}</strong><br>
          <small>Reminder: ${goal.time} (${goal.frequency})</small>
        </div>
        <button class="delete-btn" data-id="${goal.id}">Delete</button>
      `;
      goalList.appendChild(goalItem);
    });

    // Add delete button handlers
    document.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const goalId = parseInt(this.getAttribute('data-id'));
        deleteGoal(goalId);
      });
    });
  }

  function deleteGoal(goalId) {
    chrome.storage.sync.get(['goals'], function(result) {
      const goals = result.goals || [];
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      chrome.storage.sync.set({ goals: updatedGoals }, function() {
        loadGoals();
        chrome.runtime.sendMessage({ action: 'updateAlarms' });
        showStatus('Goal deleted!');
      });
    });
  }

  function showStatus(message) {
    status.textContent = message;
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }
});