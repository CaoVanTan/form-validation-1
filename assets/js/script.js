// Đối tượng Validator
function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        // var errorElement = getParent(inputElement, ".form-group");
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;
        
        // Lấy ra các rule của selector
        var rules = selectorRules[rule.selector];

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi, dừng việc kiểm tra
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if(errorMessage) break;
        }
        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add("invalid");
        } else {
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
        }

        return !errorMessage;
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    
    if (formElement) {
        // Khi submit form
        formElement.onsubmit = function(e) {
            e.preventDefault();

            var isFormValid = true;

            // Lặp qua từng rule và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            if(isFormValid) {
                // Trường hợp submit với JavaScript
                if(typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll("[name]:not([disabled])");

                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch(input.type) {
                            case "radio":
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case "checkbox":
                                if(input.matches(":checked")) {
                                    if(!Array.isArray(values[input.name])) {
                                        values[input.name] = [];
                                    }
                                    values[input.name].push(input.value);
                                } else if(!values[input.name]) {
                                    values[input.name] = "";
                                }
                                break;
                            case 'file': 
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;

                        }
                        return values;
                    }, {});

                    options.onSubmit(formValues);
                }
                // Trường hợp submit với form HTML
                else {
                    formElement.submit();
                }
            } 
        }

        // Lặp qua mỗi rule và xử lý sự kiện (blur, input, ...)
        options.rules.forEach(function (rule) {
            // Lưu lại rule cho mỗi lần input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function(inputElement) {
                if(inputElement) {
                    // Xử lý trường hợp blur ra ngoài input
                    inputElement.onblur = function() {
                        validate(inputElement, rule);
                    }
    
                    // Xử lý trường hợp người dùng nhập vào input
                    inputElement.oninput = function() {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerText = "";
                        getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
                    }
                }
            })
        });
    }
}

// Định nghĩa các rules
// Nguyên tắc của các rules:
// 1. Khi có lỗi => Trả ra messages lỗi
// 2. Khi hợp lệ => Không trả ra gì cả (undefined)
Validator.isRequired = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            return value ? undefined : message || "Vui lòng nhập trường này!";
        }
    }
}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || "Vui lòng nhập email!";
        }
    }    
}

Validator.minLength = function(selector, minLength, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= minLength ? undefined : message || `Vui lòng nhập tối thiểu ${minLength} kí tự!`;
        }
    }    
}

Validator.isConfirm = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || "Giá trị nhập vào không chính xác!";
        }
    }    
}