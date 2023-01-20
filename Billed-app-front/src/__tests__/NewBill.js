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
import store from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"

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
        expect(screen.getByText('Envoyer une note de frais')).toBeVisible()
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
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(handleChangeFile).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('file-error')).toBeVisible()
      })
    })
    describe("When I add a file with good extension", () => {
      test('Then input file have a value and error-message dont appaer', () => {
        const spy = jest.spyOn(store, 'bills');
        const newBill = new NewBill({document, onNavigate, store: Store, localStorage: window.localStorage})
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile);
        const blob = new Blob(["jpg"], { type: "image/jpg" });
        const file = new File([blob], "file.jpg", { type: "image/jpg" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(handleChangeFile).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('file-error').classList.contains('displayNone')).toBe(true)
        expect(screen.getByTestId('file-error').value).not.toBe("")
        expect(fileInput.files[0]).toStrictEqual(file)
      })
    })
  });
})

//test integration post 
describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then I submit form and it generate', async () => {
      jest.spyOn(store, 'bills');
      const update = await store.bills().update()
      const create = await store.bills().create()
     

      const bill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
    }

      expect(update).toEqual(bill)
      expect(create.fileUrl).toEqual("https://localhost:3456/images/test.jpg")    
    })
    describe("When get a error on api", () => {
      test("should get an 500 error", async () => {
        jest.spyOn(store, 'bills');
        console.error = jest.fn()
  
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = `<div id="root"></div>`
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
  
        store.bills.mockImplementationOnce(() => {
          return {
            update : () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          }
        })
        const newBill = new NewBill({document,  onNavigate, store: store, localStorage: window.localStorage})
  
        const form = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('submit', handleSubmit)
        fireEvent.submit(form)
        await new Promise(process.nextTick)
  
        expect(console.error).toBeCalled()
      })
    })
  })
})

