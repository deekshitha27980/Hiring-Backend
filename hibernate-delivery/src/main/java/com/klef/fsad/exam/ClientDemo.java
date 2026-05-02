package com.klef.fsad.exam;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;
import org.hibernate.query.Query;

import java.util.Date;
import java.util.List;

public class ClientDemo {

    public static void main(String[] args) {
        SessionFactory factory = new Configuration()
                .configure("hibernate.cfg.xml")
                .addAnnotatedClass(Delivery.class)
                .buildSessionFactory();

        try {
            int deleteId = insertDeliveries(factory);
            deleteDeliveryById(factory, deleteId);
            printAllDeliveries(factory);
        } finally {
            factory.close();
        }
    }

    private static int insertDeliveries(SessionFactory factory) {
        Session session = factory.openSession();
        Transaction tx = session.beginTransaction();

        Delivery d1 = new Delivery("Express Parcel", new Date(), "Pending", "101 Elm Street", "Asha Sharma");
        Delivery d2 = new Delivery("Food Package", new Date(), "Delivered", "45 Oak Avenue", "Ravi Kumar");

        session.persist(d1);
        session.persist(d2);

        tx.commit();
        session.close();

        System.out.println("Inserted deliveries:");
        System.out.println(d1);
        System.out.println(d2);

        return d1.getId();
    }

    private static void deleteDeliveryById(SessionFactory factory, int id) {
        Session session = factory.openSession();
        Transaction tx = session.beginTransaction();

        String hql = "delete from Delivery where id = ?1";
        Query<?> query = session.createQuery(hql);
        query.setParameter(1, id);
        int rowsAffected = query.executeUpdate();

        tx.commit();
        session.close();

        System.out.println("Deleted delivery with id=" + id + ". Rows affected=" + rowsAffected);
    }

    private static void printAllDeliveries(SessionFactory factory) {
        Session session = factory.openSession();
        List<Delivery> deliveries = session.createQuery("from Delivery", Delivery.class).getResultList();
        session.close();

        System.out.println("Current deliveries in database:");
        deliveries.forEach(System.out::println);
    }
}
