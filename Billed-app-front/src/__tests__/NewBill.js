/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect";
import { fireEvent ,screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../__mocks__/localStorage';
import Store from "../app/Store.js";

// all fields of form
const fieldsRequired = ["datepicker", "amount", "pct", "file"]
const fields = [...fieldsRequired, "vat", "expense-type", "expense-name", "commentary"]
//init function onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  document.body.innerHTML =  NewBillUI();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }) );

  describe("When I am on NewBill Page", () => {
    test("Then render new bill page", () => {
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
    });
    
    describe("When i have 8 fields in form", () => {
      test("Then have 8 fields in form", () => {
        // delet btn its not fields
        expect(document.querySelector('form').length - 1 === fields.length).toBe(true)
      })
    })

    describe("When input should required" , () => {
      //input required
      test("Then input are required", () => {
        fieldsRequired.forEach((field) => {
          expect(screen.getByTestId(field)).toBeRequired();
        })
      })
    })

    describe("When I submit a empty form", () => {
      test('Then I submit original form', () => {
        //verify all fields are empty
        fields.forEach((field) => {
          const input = screen.getByTestId(field)
          if(field !== "expense-type") {   
            expect(input.value).toBe("")
          }
        })
        // user click on submit with form empty but he not redirect
        userEvent.click(screen.getByTestId("form-new-bill"))
        expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
      })
    })

    describe("When I add file with wrong extension", () => {
      test("Then a error message appear", () => {
        const newBill = new NewBill({document, onNavigate, store: Store, localStorage: window.localStorage})
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        // add event handleChange
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile);
        const blob = new Blob(["text"], { type: "image/txt" });
         const file = new File([blob], "file.txt", { type: "image/txt" });
         fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
        expect(handleChangeFile).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('file-error')).toBeTruthy()
      })
    })
    describe("When I add a file with good extension", () => {
      test('Then input file have a value and error-message dont appaer', () => {
        const newBill = new NewBill({document, onNavigate, store: Store, localStorage: window.localStorage})
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile);
        const blob = new Blob(["jpg"], { type: "image/jpg" });
         const file = new File([blob], "file.jpg", { type: "image/jpg" });
         fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });

        expect(handleChangeFile).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('file-error').classList.contains('displayNone')).toBe(true)
        expect(screen.getByTestId('file-error').value).not.toBe("")
      })
    })
  });
})
