const modal = document.getElementById("modal");
const titleInput = document.getElementById("card-title");
const descInput = document.getElementById("card-desc");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");

const addButtons = [
    document.getElementById("btn1"),
    document.getElementById("btn2"),
    document.getElementById("btn3")
];

let currentColumn = null;
let editCard = null;
let draggedCard = null;

loadBoard();

addButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentColumn = btn.parentElement.querySelector(".cards");
        editCard = null;
        titleInput.value = "";
        descInput.value = "";
        modal.classList.remove("hidden");
    });
});

cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
});

saveBtn.addEventListener("click", () => {

    const title = titleInput.value.trim();
    const desc = descInput.value.trim();

    if(title === ""){
        alert("Enter card title");
        return;
    }

    if(editCard){

        editCard.querySelector("h3").textContent = title;
        editCard.querySelector("p").textContent = desc;

    }else{

        const card = createCard(title, desc);
        currentColumn.appendChild(card);

    }

    saveBoard();
    modal.classList.add("hidden");
});

function createCard(title, desc){

    const card = document.createElement("div");
    card.classList.add("card");
    card.setAttribute("draggable","true");

    card.innerHTML = `
        <h3>${title}</h3>
        <p>${desc}</p>
        <button class="delete-btn">Delete</button>
    `;

    card.addEventListener("dragstart", () => {
        draggedCard = card;
        setTimeout(() => {
            card.style.display = "none";
        },0);
    });

    card.addEventListener("dragend", () => {
        card.style.display = "block";
        draggedCard = null;
        saveBoard();
    });

    card.querySelector(".delete-btn")
    .addEventListener("click", () => {
        card.remove();
        saveBoard();
    });

    card.addEventListener("dblclick", () => {

        editCard = card;

        titleInput.value =
            card.querySelector("h3").textContent;

        descInput.value =
            card.querySelector("p").textContent;

        modal.classList.remove("hidden");
    });

    return card;
}

document.querySelectorAll(".cards")
.forEach(column => {

    column.addEventListener("dragover",(e)=>{
        e.preventDefault();
    });

    column.addEventListener("drop",(e)=>{
        e.preventDefault();

        if(draggedCard){
            column.appendChild(draggedCard);
            saveBoard();
        }
    });

});

function saveBoard(){

    const boardData = {};

    document.querySelectorAll(".column")
    .forEach(column => {

        const columnId = column.id;

        boardData[columnId] = [];

        column.querySelectorAll(".card")
        .forEach(card => {

            boardData[columnId].push({
                title: card.querySelector("h3").textContent,
                desc: card.querySelector("p").textContent
            });

        });

    });

    localStorage.setItem(
        "kanbanBoard",
        JSON.stringify(boardData)
    );
}

function loadBoard(){

    const data =
    JSON.parse(localStorage.getItem("kanbanBoard"));

    if(!data) return;

    Object.keys(data).forEach(columnId => {

        const column =
        document.querySelector(
            `#${columnId} .cards`
        );

        data[columnId].forEach(task => {

            const card =
            createCard(task.title, task.desc);

            column.appendChild(card);

        });

    });

}