document.addEventListener("DOMContentLoaded", function () {
    const questions = document.querySelectorAll(".question");

    questions.forEach((question) => {
        question.addEventListener("click", function (e) {
            const targetQuestion = e.target.closest(".question");
            if (!targetQuestion) return;

            const answer = targetQuestion.parentElement.querySelector(".answer-question");
            const icon = targetQuestion.querySelector(".plus-icon");

            const isOpen = answer.classList.contains("show");

            if (isOpen) {
                answer.classList.remove("show");
                icon.textContent = "+";
            } else {
                answer.classList.add("show");
                icon.textContent = "-";
            }
        });
    });
});
