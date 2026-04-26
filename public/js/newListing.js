// Wait for the entire HTML page to finish loading before running our script
document.addEventListener("DOMContentLoaded", () => {
    
    // Select all the HTML elements we need to interact with
    const steps = document.querySelectorAll('.form-step'); // The 3 main sections of the form
    const nextBtn = document.getElementById('nextBtn'); // The "Next" button
    const prevBtn = document.getElementById('prevBtn'); // The "Back" button
    const submitBtn = document.getElementById('submitBtn'); // The final "Publish Listing" button
    const stepIndicators = document.querySelectorAll('.step-indicator'); // The 1, 2, 3 circles on the left banner
    const stepTitle = document.getElementById('stepTitle'); // The heading text (e.g. "Step 1: The Basics")
    
    // The titles we want to show at the top for each specific step
    const titles = ["Step 1: The Basics", "Step 2: Capacity & Amenities", "Step 3: Pricing"];
    
    // Keep track of which step the user is currently on (0 = Step 1)
    let currentStep = 0;

    /**
     * This function controls what the user sees on the screen.
     * It hides the steps they shouldn't see and shows the step they are currently on.
     */
    function showStep(index) {
        // 1. Show or hide the actual form sections
        steps.forEach((step, i) => {
            if (i === index) {
                // If this is the current step, show it using Flexbox
                step.classList.remove('hidden');
                step.classList.add('flex');
            } else {
                // Otherwise, hide it
                step.classList.add('hidden');
                step.classList.remove('flex');
            }
        });

        // 2. Update the big title text at the top
        stepTitle.textContent = titles[index];

        // 3. Figure out which buttons should be visible
        if (index === 0) {
            // On the very first step, hide the "Back" button
            prevBtn.classList.add('hidden');
        } else {
            // On any other step, show the "Back" button
            prevBtn.classList.remove('hidden');
        }

        if (index === steps.length - 1) {
            // If we are on the very last step, hide the "Next" button and show the "Publish" button
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            // Otherwise, show the "Next" button and hide the "Publish" button
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }

        // 4. Update the visual 1, 2, 3 progress indicators on the left banner
        stepIndicators.forEach((indicator, i) => {
            const icon = indicator.querySelector('.step-icon');
            
            if (i === index) {
                // This is the active step: Make it fully visible (opacity-100) with a white background
                indicator.classList.remove('opacity-50');
                indicator.classList.add('opacity-100');
                icon.classList.remove('bg-white/20', 'bg-green-500', 'text-white');
                icon.classList.add('bg-white', 'text-black');
                icon.innerHTML = `<i class="fa-solid fa-${i + 1} font-bold"></i>`;
            } else if (i < index) {
                // This is a completed step: Keep it fully visible and show a highlighted green checkmark
                indicator.classList.remove('opacity-50');
                indicator.classList.add('opacity-100');
                icon.classList.remove('bg-white', 'bg-white/20', 'text-black');
                icon.classList.add('bg-green-500', 'text-white');
                icon.innerHTML = '<i class="fa-solid fa-check font-bold"></i>';
            } else {
                // This is a future step: Fade it out slightly and show its normal number
                indicator.classList.remove('opacity-100');
                indicator.classList.add('opacity-50');
                icon.classList.remove('bg-white', 'bg-green-500', 'text-black');
                icon.classList.add('bg-white/20', 'text-white');
                icon.innerHTML = `<i class="fa-solid fa-${i + 1} font-bold"></i>`;
            }
        });
    }

    /**
     * This function checks if the current step is filled out correctly 
     * before letting the user move to the next step.
     */
    function validateStep() {
        const form = document.getElementById('multiStepForm');
        
        // Find all inputs in the current step that have the "required" attribute
        const inputs = steps[currentStep].querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        // Add the 'was-validated' class. This tells our custom CSS to start showing red/green borders and text.
        form.classList.add('was-validated');

        // Loop through all required inputs to see if any are empty or invalid
        for (let input of inputs) {
            // checkValidity() is a built-in browser function that checks things like "is it empty?" or "is it too short?"
            if (!input.checkValidity()) {
                isValid = false; // If even one input fails, the whole step is invalid
            }
        }
        
        // Return true if everything is good, or false if there are errors
        return isValid;
    }

    // --- Event Listeners (Reacting to user clicks) ---

    // Real-time validation: Show "Looks good!" as soon as they type
    const allRequiredInputs = document.querySelectorAll('input[required], textarea[required]');
    allRequiredInputs.forEach(input => {
        // When the user types or changes the value
        input.addEventListener('input', () => {
            // Add a class that tells CSS to validate just this specific field
            input.classList.add('is-touched');
        });
    });

    const form = document.getElementById('multiStepForm');
    if (form) {
        // When the user clicks the final "Publish Listing" submit button...
        form.addEventListener('submit', event => {
            // Check the entire form one last time. If anything is wrong...
            if (!form.checkValidity()) {
                event.preventDefault(); // Stop the form from submitting to the server
                event.stopPropagation(); // Stop any other scripts from running
                form.classList.add('was-validated'); // Show the red error messages
            }
        }, false);
    }

    if (nextBtn) {
        // When the user clicks the "Next" button...
        nextBtn.addEventListener('click', () => {
            // First, make sure they filled out the current step correctly
            if (validateStep()) {
                // If it's valid, increase our step counter and update the screen
                currentStep++;
                showStep(currentStep);
            }
        });
    }

    if (prevBtn) {
        // When the user clicks the "Back" button...
        prevBtn.addEventListener('click', () => {
            // Decrease our step counter and update the screen
            currentStep--;
            showStep(currentStep);
        });
    }

    // When the page first loads, trigger the showStep function to set up the initial view (Step 1)
    if (steps.length > 0) {
        showStep(currentStep);
    }
});
