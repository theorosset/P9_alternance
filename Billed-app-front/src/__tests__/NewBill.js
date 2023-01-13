/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect";
import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../__mocks__/localStorage';


// all fields of form
const fieldsRequired = ["datepicker", "amount", "pct", "file"]
const fields = [...fieldsRequired, "vat", "expense-type", "expense-name", "commentary"]


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
  });
})
