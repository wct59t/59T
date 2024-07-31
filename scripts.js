document.addEventListener("DOMContentLoaded", () => {
    console.log("Document loaded");

    const dropdowns = document.querySelectorAll("nav ul li");
    const finalizeBtn = document.getElementById("finalize-btn");
    const cartBtn = document.getElementById("cart-btn");
    const totalItemsDisplay = document.getElementById("total-items");
    const removeBtn = document.getElementById("remove-btn");
    const selectedItemsContainer = document.getElementById("selected-items-container");
    const productImageFront = document.getElementById("product-image-front");
    const productImageBack = document.getElementById("product-image-back");
    const productBtns = document.querySelectorAll(".product-btn");
    const productImagesContainer = document.querySelector(".product-images");

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let draggedItemsCount = {};
    let isDraggingFromSelectedItems = false;
    let currentDraggedElement = null;  // 记录当前拖拽的元素

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateTotalItems() {
        let totalItems = cart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        totalItemsDisplay.textContent = totalItems;
    }

    function sortCartItems(items) {
        const order = ["字母", "小圖案", "中圖案", "大圖案"];
        return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    }

    function showCartItems() {
        const overlay = document.createElement("div");
        overlay.classList.add("cart-items-overlay");

        const container = document.createElement("div");
        container.classList.add("cart-items-container");

        const sortedCart = sortCartItems(cart);

        sortedCart.forEach((item, index) => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");

            const itemInfo = document.createElement("span");
            itemInfo.textContent = `${item.category} - ${item.name}: ${item.quantity}個`;

            const removeButton = document.createElement("button");
            removeButton.textContent = "移除";
            removeButton.addEventListener("click", () => {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                saveCart();
                updateTotalItems();
                document.body.removeChild(overlay);
                showCartItems();
                renderSelectedItems();
            });

            cartItem.appendChild(itemInfo);
            cartItem.appendChild(removeButton);
            container.appendChild(cartItem);
        });

        const categoryCounts = cart.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = 0;
            }
            acc[item.category] += parseInt(item.quantity);
            return acc;
        }, {});

        Object.keys(categoryCounts).forEach(category => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            cartItem.innerHTML = `<span>${category}總數: ${categoryCounts[category]}個</span>`;
            container.appendChild(cartItem);
        });

        const closeButton = document.createElement("button");
        closeButton.textContent = "關閉";
        closeButton.style.marginTop = "10px";
        closeButton.style.padding = "10px 20px";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(overlay);
        });

        container.appendChild(closeButton);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    function renderSelectedItems() {
        if (selectedItemsContainer) {
            selectedItemsContainer.innerHTML = '';
            const sortedCart = sortCartItems(cart);
            sortedCart.forEach((item, index) => {
                const selectedItem = document.createElement("div");
                selectedItem.classList.add("selected-item");
                selectedItem.setAttribute("data-category", item.category);
                selectedItem.setAttribute("data-name", item.name);
                selectedItem.setAttribute("data-index", index);
                selectedItem.draggable = true;

                const itemImage = document.createElement("img");
                itemImage.src = item.imageSrc;
                itemImage.style.width = '2cm'; // 缩小图片
                itemImage.style.height = '2cm';
                itemImage.style.objectFit = 'contain';
                selectedItem.appendChild(itemImage);

                const itemInfo = document.createElement("span");
                itemInfo.innerHTML = `${item.name} (${item.quantity})<br>已放: ${draggedItemsCount[index] || 0}`;
                selectedItem.appendChild(itemInfo);

                selectedItem.addEventListener("dragstart", (e) => {
                    isDraggingFromSelectedItems = true;
                    currentDraggedElement = selectedItem;
                    e.dataTransfer.setData("index", index);
                    e.dataTransfer.setData("category", item.category);
                    e.dataTransfer.setData("name", item.name);
                    e.dataTransfer.setData("src", item.imageSrc);
                    setTimeout(() => {
                        selectedItem.classList.add('dragging');
                    }, 0);
                });

                selectedItem.addEventListener("dragend", () => {
                    isDraggingFromSelectedItems = false;
                    selectedItem.classList.remove('dragging');
                    currentDraggedElement = null;
                });

                selectedItemsContainer.appendChild(selectedItem);
            });
        }
    }

    function updateCart(imageSrc, quantity, category, name) {
        const item = cart.find(i => i.imageSrc === imageSrc && i.category === category && i.name === name);
        if (item) {
            item.quantity += parseInt(quantity);
        } else {
            cart.push({ imageSrc, quantity: parseInt(quantity), category, name });
        }
        saveCart();
        updateTotalItems();
        renderSelectedItems();
    }

    cartBtn.addEventListener("click", () => showCartItems());

    if (removeBtn) {
        removeBtn.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        removeBtn.addEventListener("drop", (e) => {
            e.preventDefault();
            if (currentDraggedElement) {
                const index = currentDraggedElement.dataset.index;
                const category = currentDraggedElement.dataset.category;
                const name = currentDraggedElement.dataset.name;
                const src = currentDraggedElement.dataset.src;

                if (index !== '') {
                    if (isDraggingFromSelectedItems) {
                        // 从已选物件区拖拽过来
                        // 直接删除创作区中所有相同类型的物件
                        const creationItems = document.querySelectorAll(`.product-display .draggable[data-category="${category}"][data-name="${name}"]`);
                        creationItems.forEach(item => item.remove());

                        // 更新购物车，移除拖拽的图案
                        cart = cart.filter(item => !(item.category === category && item.name === name && item.imageSrc === src));
                        delete draggedItemsCount[index];  // 重设拖拽计数
                        saveCart();
                        updateTotalItems();
                        renderSelectedItems();
                    } else {
                        // 从创作区拖拽过来
                        // 移除创作区的单个元素
                        currentDraggedElement.remove();
                        if (draggedItemsCount[index] > 0) {
                            draggedItemsCount[index]--;
                        }

                        const itemInfoSpan = document.querySelector(`.selected-item[data-category="${category}"][data-name="${name}"] span`);
                        if (itemInfoSpan) {
                            itemInfoSpan.innerHTML = `${name} (${cart[index].quantity})<br>已放: ${draggedItemsCount[index]}`;
                        }

                        // 如果所有相同类型的图案都被移除，则从购物车中删除该项
                        if (draggedItemsCount[index] <= 0) {
                            delete draggedItemsCount[index];  // 重设拖拽计数
                            saveCart();
                            updateTotalItems();
                            renderSelectedItems();
                        }
                    }
                }
                currentDraggedElement = null;
            }
        });
    }

    dropdowns.forEach(dropdown => {
        dropdown.addEventListener("mouseover", () => {
            const submenu = dropdown.querySelector(".dropdown");
            if (submenu) {
                submenu.style.display = "block";
            }
        });

        dropdown.addEventListener("mouseout", () => {
            const submenu = dropdown.querySelector(".dropdown");
            if (submenu) {
                submenu.style.display = "none";
            }
        });
    });

    const images = document.querySelectorAll(".image-item img");
    images.forEach(image => {
        image.addEventListener("click", () => {
            const overlay = document.createElement("div");
            overlay.classList.add("overlay");

            const enlargedImg = document.createElement("img");
            enlargedImg.src = image.src;
            overlay.appendChild(enlargedImg);

            const controls = document.createElement("div");
            controls.classList.add("controls");

            const addButton = document.createElement("button");
            addButton.textContent = "添加";
            controls.appendChild(addButton);

            const quantitySelect = document.createElement("select");
            for (let i = 1; i <= 10; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i;
                quantitySelect.appendChild(option);
            }
            controls.appendChild(quantitySelect);

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "取消";
            controls.appendChild(cancelButton);

            overlay.appendChild(controls);
            document.body.appendChild(overlay);

            document.querySelector('header').style.backgroundColor = 'rgba(51, 51, 51, 0.5)';
            document.querySelector('footer').style.backgroundColor = 'rgba(51, 51, 51, 0.5)';

            addButton.addEventListener("click", () => {
                const category = image.dataset.category;
                const name = image.dataset.name;
                if (!category) {
                    alert("未定義的項目類別");
                    return;
                }
                const quantity = quantitySelect.value;
                updateCart(image.src, quantity, category, name);
                document.body.removeChild(overlay);
                document.querySelector('header').style.backgroundColor = 'rgba(51, 51, 51, 1)';
                document.querySelector('footer').style.backgroundColor = 'rgba(51, 51, 51, 1)';
            });

            cancelButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
                document.querySelector('header').style.backgroundColor = 'rgba(51, 51, 51, 1)';
                document.querySelector('footer').style.backgroundColor = 'rgba(51, 51, 51, 1)';
            });
        });
    });

    if (productBtns.length > 0) {
        productBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const product = e.target.dataset.product;

                switch (product) {
                    case "pencil-case":
                        productImageFront.src = "pencil-case-front.jpeg";
                        productImageBack.src = "pencil-case-front.jpeg";
                        break;
                    case "yo-yo-card-holder":
                        productImageFront.src = "images/yo-yo-card-holder-front.jpg";
                        productImageBack.src = "images/yo-yo-card-holder-back.jpg";
                        break;
                    case "cup-sleeve":
                        productImageFront.src = "images/cup-sleeve-front.jpg";
                        productImageBack.src = "images/cup-sleeve-back.jpg";
                        break;
                    case "socks":
                        productImageFront.src = "images/socks-front.jpg";
                        productImageBack.src = "images/socks-back.jpg";
                        break;
                    case "towel":
                        productImageFront.src = "images/towel-front.jpg";
                        productImageBack.src = "images/towel-back.jpg";
                        break;
                    default:
                        productImageFront.src = "images/59t logo.jpg";
                        productImageBack.src = "images/59t logo.jpg";
                }

                const productName = e.target.textContent;
                const frontLabel = productImageFront.nextElementSibling;
                const backLabel = productImageBack.nextElementSibling;

                frontLabel.textContent = `${productName} 正面示意圖`;
                backLabel.textContent = `${productName} 反面示意圖`;

                productImagesContainer.style.display = "flex";
            });
        });
    }

    if (finalizeBtn) {
        finalizeBtn.addEventListener("click", async () => {
            console.log("Finalize button clicked");
            const productDisplay = document.querySelector('.product-display');
            console.log("Product display element:", productDisplay);

            try {
                const canvas = await html2canvas(productDisplay, { allowTaint: false, useCORS: true });
                console.log("Canvas generated:", canvas);
                canvas.toBlob((blob) => {
                    console.log("Blob generated:", blob);
                    saveAs(blob, 'product-design.png');
                }, 'image/png');
            } catch (error) {
                console.error("Error capturing the screenshot and saving the image:", error);
            }
        });
    }

    const placeBtn = document.getElementById("place-btn");
    if (placeBtn) {
        placeBtn.addEventListener("click", () => {
            window.location.href = "creation.html";
        });
    }

    updateTotalItems();
    renderSelectedItems();

    function makeElementDraggable(container, newElement) {
        let offsetX, offsetY;
        currentDraggedElement = null;

        function onMouseMove(e) {
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
        }

        function onTouchMove(e) {
            let touch = e.touches[0];
            container.style.left = `${touch.clientX - offsetX}px`;
            container.style.top = `${touch.clientY - offsetY}px`;
        }

        container.addEventListener("mousedown", (e) => {
            offsetX = e.clientX - container.offsetLeft;
            offsetY = e.clientY - container.offsetTop;
            currentDraggedElement = container;

            document.addEventListener("mousemove", onMouseMove);

            document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", onMouseMove);
                currentDraggedElement = null;  // 取消记录当前拖拽的元素
            }, { once: true });
        });

        container.addEventListener("touchstart", (e) => {
            let touch = e.touches[0];
            offsetX = touch.clientX - container.offsetLeft;
            offsetY = touch.clientY - container.offsetTop;
            currentDraggedElement = container;

            document.addEventListener("touchmove", onTouchMove);

            document.addEventListener("touchend", () => {
                document.removeEventListener("touchmove", onTouchMove);
                currentDraggedElement = null;  // 取消记录当前拖拽的元素
            }, { once: true });
        });

        const rotationHandle = document.createElement("div");
        rotationHandle.classList.add("rotation-handle");
        rotationHandle.innerHTML = "↻";
        container.appendChild(rotationHandle);

        let startX, startY, startRotation;

        function onMouseRotateMove(e) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            container.style.transform = `rotate(${startRotation + angle}deg)`;
        }

        rotationHandle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            startRotation = parseFloat(container.style.transform.replace(/[^0-9.-]/g, '')) || 0;

            document.addEventListener("mousemove", onMouseRotateMove);

            document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", onMouseRotateMove);
            }, { once: true });
        });

        rotationHandle.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            let touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startRotation = parseFloat(container.style.transform.replace(/[^0-9.-]/g, '')) || 0;

            function onTouchRotateMove(e) {
                let touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                container.style.transform = `rotate(${startRotation + angle}deg)`;
            }

            document.addEventListener("touchmove", onTouchRotateMove);

            document.addEventListener("touchend", () => {
                document.removeEventListener("touchmove", onTouchRotateMove);
            }, { once: true });
        });

        container.appendChild(newElement);
        productDisplay.appendChild(container);
    }

    const productDisplay = document.querySelector('.product-display');

    productDisplay.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    productDisplay.addEventListener("drop", (e) => {
        e.preventDefault();
        const index = e.dataTransfer.getData("index");
        const category = e.dataTransfer.getData("category");
        const name = e.dataTransfer.getData("name");
        const src = e.dataTransfer.getData("src");
        if (index !== '') {
            const item = cart[index];
            const newElement = document.createElement("img");
            newElement.src = src;

            const container = document.createElement("div");
            container.classList.add("draggable");
            container.dataset.index = index;
            container.dataset.category = category;
            container.dataset.name = name;
            container.dataset.src = src;
            container.style.position = "absolute";
            container.style.left = `${e.clientX - productDisplay.offsetLeft}px`;
            container.style.top = `${e.clientY - productDisplay.offsetTop}px`;
            container.style.transform = "rotate(0deg)";
            container.style.width = window.innerWidth <= 480 ? "2.5cm" : window.innerWidth <= 768 ? "3cm" : "6cm"; // 根据屏幕大小调整
            container.style.height = window.innerWidth <= 480 ? "2.5cm" : window.innerWidth <= 768 ? "3cm" : "6cm"; // 根据屏幕大小调整
            newElement.style.width = "100%";
            newElement.style.height = "100%";
            newElement.style.objectFit = "contain";

            makeElementDraggable(container, newElement);

            // 更新已选项中的拖拽计数
            if (!draggedItemsCount[index]) draggedItemsCount[index] = 0;
            draggedItemsCount[index]++;
            const itemInfoSpan = document.querySelector(`.selected-item[data-category="${item.category}"][data-name="${item.name}"] span`);
            if (itemInfoSpan) {
                itemInfoSpan.innerHTML = `${item.name} (${item.quantity})<br>已放: ${draggedItemsCount[index]}`;
            }
        }
    });

    document.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("draggable")) {
            isDraggingFromSelectedItems = false;
            currentDraggedElement = e.target;  // 记录当前拖拽的元素
            e.dataTransfer.setData("index", e.target.dataset.index);
            e.dataTransfer.setData("category", e.target.dataset.category);
            e.dataTransfer.setData("name", e.target.dataset.name);
            e.dataTransfer.setData("src", e.target.dataset.src);
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    document.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("draggable")) {
            e.target.classList.remove('dragging');
            currentDraggedElement = null;  // 取消记录当前拖拽的元素
        }
    });

    document.addEventListener("touchstart", (e) => {
        if (e.target.classList.contains("draggable")) {
            isDraggingFromSelectedItems = false;
            currentDraggedElement = e.target;  // 记录当前拖拽的元素
            let touch = e.touches[0];
            offsetX = touch.clientX - currentDraggedElement.offsetLeft;
            offsetY = touch.clientY - currentDraggedElement.offsetTop;
            setTimeout(() => {
                currentDraggedElement.classList.add('dragging');
            }, 0);
        }
    });

    document.addEventListener("touchend", (e) => {
        if (currentDraggedElement && currentDraggedElement.classList.contains("draggable")) {
            currentDraggedElement.classList.remove('dragging');
            currentDraggedElement = null;  
        }
    });

    function handleTouchMove(e) {
        let touch = e.touches[0];
        let container = currentDraggedElement;
        if (container) {
            container.style.left = `${touch.clientX - offsetX}px`;
            container.style.top = `${touch.clientY - offsetY}px`;
        }
    }

    document.addEventListener("touchmove", handleTouchMove);
});
